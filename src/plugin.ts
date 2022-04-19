// global
import { FastifyPluginAsync } from 'fastify';
import { Item, Member, IdParam, Actor, ItemMembership } from 'graasp';
import fs from 'fs';
import path from 'path';
import mailerPlugin from 'graasp-mailer';
import {
  FileTaskManager,
  GraaspLocalFileItemOptions,
  GraaspS3FileItemOptions,
  ServiceMethod,
} from 'graasp-plugin-file';

// local
import { GetActionsTask } from './services/action/get-actions-task';
import { BaseAction } from './services/action/base-action';
import { ActionService } from './db-service';
import { Action } from './interfaces/action';
import {
  ACTION_TYPES,
  CLIENT_HOSTS,
  MAX_ACTIONS_SAMPLE_SIZE,
  TMP_FOLDER_PATH,
  VIEW_BUILDER_NAME,
  ZIP_MIMETYPE,
} from './constants/constants';
import { getOne, deleteAllById, exportAction } from './schemas/schemas';
import { BaseAnalytics } from './services/action/base-analytics';
import { Analytics, AnalyticsQueryParams } from './interfaces/analytics';
import { ActionTaskManager } from './task-manager';
import { StatusCodes } from 'http-status-codes';
import { buildActionFilePath, buildItemTmpFolder, createActionArchive } from './utils/export';

export type Hostname = {
  name: string;
  hostname: string;
};
export interface GraaspActionsOptions {
  graaspActor: Actor;
  shouldSave?: boolean;
  hosts: Hostname[];
  serviceMethod: ServiceMethod;
  serviceOptions: { s3: GraaspS3FileItemOptions; local: GraaspLocalFileItemOptions };
}

const plugin: FastifyPluginAsync<GraaspActionsOptions> = async (fastify, options) => {
  const {
    items: { taskManager: itemTaskManager },
    members: { taskManager: memberTaskManager },
    itemMemberships: { taskManager: itemMembershipsTaskManager },
    taskRunner: runner,
    mailer,
  } = fastify;
  const { serviceMethod, serviceOptions, shouldSave, hosts } = options;

  const actionService = new ActionService();
  const actionTaskManager = new ActionTaskManager(actionService, hosts);

  const fileTaskManager = new FileTaskManager(serviceOptions, serviceMethod);

  if (!mailerPlugin) {
    throw new Error('Mailer plugin is not defined');
  }

  const getActions = async ({ member, itemId }) => {
    const getTasks = CLIENT_HOSTS.map(({ name }) => {
      // todo: get all actions? will depend on subscription?
      // TODO: should get latest and not random actions!!
      return new GetActionsTask(member, itemId, MAX_ACTIONS_SAMPLE_SIZE, name, actionService);
    });
    return runner.runMultiple(getTasks);
  };

  const uploadArchive =
    ({ member, log }) =>
    async ({ filepath, itemId, timestamp, mimetype }) => {
      log.debug(`upload archive for item ${itemId}`);

      const uploadFilePath = buildActionFilePath(itemId, timestamp);
      const uploadTask = fileTaskManager.createUploadFileTask(member, {
        file: fs.createReadStream(filepath),
        filepath: uploadFilePath,
        mimetype,
        size: fs.statSync(filepath).size,
      });
      await runner.runSingle(uploadTask);
      return uploadFilePath;
    };

  const onSuccess =
    ({ member, log }) =>
    async ({ itemId, timestamp }) => {
      // send mail
      log.debug('send action file by mail');
      const lang = member?.extra?.lang;
      const getDownloadLinkTask = fileTaskManager.createDownloadFileTask(member, {
        filepath: buildActionFilePath(itemId, timestamp),
        itemId,
        mimetype: ZIP_MIMETYPE,
      });

      const downloadLink = (await runner.runSingle(getDownloadLinkTask)) as string;
      await mailer.sendActionExportEmail(member, downloadLink, lang);
    };

  // set hook handlers if can save actions
  if (shouldSave) {
    // save action when an item is created
    // we cannot use the onResponse hook in this case because in the creation of an item
    // the response object does not provide the item id (it is created later), therefore we do not have information about the item
    const createItemTaskName = itemTaskManager.getCreateTaskName();
    runner.setTaskPostHookHandler(
      createItemTaskName,
      async (item: Partial<Item>, actor, { handler }) => {
        const member = actor as Member;
        const extra = { memberId: actor.id, itemId: item.id };
        // create only happens in builder
        const view = VIEW_BUILDER_NAME;
        const geolocation = null;
        const action: Action = new BaseAction({
          memberId: actor.id,
          itemId: item.id,
          memberType: member.type,
          itemType: item.type,
          actionType: ACTION_TYPES.CREATE,
          view,
          geolocation,
          extra,
        });
        await actionService.create(action, handler);
      },
    );

    // save action when an item is deleted
    // we cannot use the onResponse hook in this case because when an item is deleted
    // the onResponse hook is executed after the item is removed, therefore we do not have information about the item
    const deleteItemTaskName = itemTaskManager.getDeleteTaskName();
    runner.setTaskPostHookHandler(
      deleteItemTaskName,
      async (item: Partial<Item>, actor, { handler }) => {
        const member = actor as Member;
        const extra = { memberId: actor.id, itemId: item.id };
        // delete only happens in builder
        const view = VIEW_BUILDER_NAME;
        const geolocation = null;
        // cannot add item id because it will be removed from the db
        const action: Action = new BaseAction({
          memberId: actor.id,
          memberType: member.type,
          itemId: null,
          itemType: item.type,
          actionType: ACTION_TYPES.DELETE,
          view,
          geolocation,
          extra,
        });
        actionService.create(action, handler);
      },
    );
  }

  // get all the actions matching the given `id`
  fastify.get<{ Params: IdParam; Querystring: AnalyticsQueryParams }>(
    '/items/:id',
    { schema: getOne },
    async ({ member, params: { id }, query: { requestedSampleSize, view }, log }, reply) => {
      const itemId = id;
      // get actions aplying the parameters (view and requestedSampleSize)
      const t1 = new GetActionsTask(member, itemId, requestedSampleSize, view, actionService);
      const actions = await runner.runSingle(t1);

      // get item
      const t2 = itemTaskManager.createGetTaskSequence(member, itemId);
      const itemResponse = await runner.runSingleSequence(t2);
      const item = itemResponse as Item;

      // get memberships of the item
      const t3 = itemMembershipsTaskManager.createGetOfItemTaskSequence(member, itemId);
      const membershipsResponse = await runner.runSingleSequence(t3);
      const memberships = membershipsResponse as ItemMembership[];

      // get members of the item
      const tasks = memberships.map((membership) =>
        memberTaskManager.createGetTask(member, membership.memberId),
      );
      const membersResponse = await runner.runMultiple(tasks, log);
      const members = membersResponse as Member[];

      const numActionsRetrieved = actions.length;
      const metadata = {
        numActionsRetrieved: numActionsRetrieved,
        requestedSampleSize: requestedSampleSize,
      };

      // generate responseData with actions, members, item, and metadata
      const responseData: Analytics = new BaseAnalytics(actions, members, item, metadata);

      reply.send(responseData);
    },
  );

  // get all the actions matching the given `id`
  fastify.route<{ Params: IdParam }>({
    method: 'POST',
    url: '/items/:id/export',
    schema: exportAction,
    handler: async ({ member, params: { id: itemId }, log }, reply) => {
      // create tmp folder to temporaly save files
      const tmpFolder = path.join(TMP_FOLDER_PATH, itemId);
      fs.mkdirSync(tmpFolder, { recursive: true });

      createActionArchive({
        itemId,
        tmpFolder,
        getActions: getActions({ member, itemId }),
        onSuccess: onSuccess({ member, log }),
        uploadArchive: uploadArchive({ member, log }),
      });

      // reply no content and let the server create the archive and send the mail
      reply.status(StatusCodes.NO_CONTENT);
    },
    // on response delete tmp folder
    onResponse: async ({ params, log }) => {
      // delete tmp files after endpoint responded
      const itemId = (params as IdParam)?.id;
      const fileStorage = buildItemTmpFolder(itemId);
      if (fs.existsSync(fileStorage)) {
        fs.rmSync(fileStorage, { recursive: true });
      } else {
        log?.error(`${fileStorage} was not found, and was not deleted`);
      }
    },
  });

  // delete all the actions matching the given `memberId`
  fastify.delete<{ Params: IdParam }>(
    '/members/:id/delete',
    { schema: deleteAllById },
    async ({ member, params: { id } }) => {
      const task = actionTaskManager.createDeleteTask(member, id);
      return runner.runSingle(task);
    },
  );
};

export default plugin;

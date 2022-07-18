import fs from 'fs';
import { StatusCodes } from 'http-status-codes';
import path from 'path';

import { FastifyPluginAsync } from 'fastify';

import {
  Actor,
  FileItemType,
  IdParam,
  Item,
  LocalFileConfiguration,
  Member,
  S3FileConfiguration,
} from '@graasp/sdk';
import mailerPlugin from 'graasp-mailer';
import { FileTaskManager } from 'graasp-plugin-file';

import {
  ACTION_TYPES,
  DEFAULT_REQUEST_EXPORT_INTERVAL,
  EXPORT_FILE_EXPIRATION,
  EXPORT_FILE_EXPIRATION_DAYS,
  PermissionLevel,
  TMP_FOLDER_PATH,
  VIEW_BUILDER_NAME,
  ZIP_MIMETYPE,
} from './constants/constants';
import { Action } from './interfaces/action';
import { AnalyticsQueryParams } from './interfaces/analytics';
import { RequestExport } from './interfaces/requestExport';
import { deleteAllById, exportAction, getItemActions } from './schemas/schemas';
import { BaseAction } from './services/action/base-action';
import { ActionService } from './services/action/db-service';
import { ActionTaskManager } from './services/action/task-manager';
import { RequestExportService } from './services/requestExport/db-service';
import { RequestExportTaskManager } from './services/requestExport/task-manager';
import { buildActionFilePath, buildArchiveDateAsName, buildItemTmpFolder } from './utils/export';

export type Hostname = {
  name: string;
  hostname: string;
};
export interface GraaspActionsOptions {
  graaspActor: Actor;
  shouldSave?: boolean;
  hosts: Hostname[];
  fileItemType: FileItemType;
  fileConfigurations: { s3: S3FileConfiguration; local: LocalFileConfiguration };
}

const plugin: FastifyPluginAsync<GraaspActionsOptions> = async (fastify, options) => {
  const {
    items: { taskManager: itemTaskManager },
    members: { taskManager: memberTaskManager },
    itemMemberships: { taskManager: itemMembershipsTaskManager },
    taskRunner: runner,
    mailer,
  } = fastify;
  const { fileItemType, fileConfigurations, shouldSave, hosts } = options;

  const actionService = new ActionService();
  const actionTaskManager = new ActionTaskManager(
    actionService,
    itemTaskManager,
    itemMembershipsTaskManager,
    memberTaskManager,
    hosts,
  );

  const fileTaskManager = new FileTaskManager(fileConfigurations, fileItemType);
  const requestExportDS = new RequestExportService();
  const requestExportTaskManager = new RequestExportTaskManager(
    requestExportDS,
    actionTaskManager,
    fileTaskManager,
    hosts,
  );

  if (!mailerPlugin) {
    throw new Error('Mailer plugin is not defined');
  }

  const createExportLinkAndSendMail = async ({ member, item, log, archiveDate }) => {
    // get download link
    const lang = member?.extra?.lang as string;
    const filepath = buildActionFilePath(item.id, archiveDate);
    const getDownloadLinkTask = fileTaskManager.createDownloadFileTask(member, {
      filepath,
      itemId: item.id,
      mimetype: ZIP_MIMETYPE,
      expiration: EXPORT_FILE_EXPIRATION,
    });

    try {
      // throws if file is not found
      const downloadLink = (await runner.runSingle(getDownloadLinkTask)) as string;

      // send mail
      log.debug('send action file by mail');
      await mailer
        .sendExportActionsEmail(member, downloadLink, item.name, lang, EXPORT_FILE_EXPIRATION_DAYS)
        .catch((err) => {
          log.warn(err, `mailer failed. action download link: ${downloadLink}`);
        });
      return downloadLink;
    } catch (err) {
      if (err?.statusCode !== StatusCodes.NOT_FOUND) {
        throw err;
      }
      console.log(err);
    }
  };

  // set hook handlers if can save actions
  if (shouldSave) {
    // save action when an item is created
    // we cannot use the onResponse hook in this case because in the creation of an item
    // the response object does not provide the item id (it is created later), therefore we do not have information about the item
    // todo: with a refactor, this posthookhandler can be defined in the core in the item service
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
          itemPath: item.path,
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
    // todo: with a refactor, this posthookhandler can be defined in the core in the item service
    const deleteItemTaskName = itemTaskManager.getDeleteTaskName();
    runner.setTaskPostHookHandler(
      deleteItemTaskName,
      async (item: Partial<Item>, actor, { handler }) => {
        const member = actor as Member;
        const extra = { memberId: actor.id, itemId: item.id };
        // delete only happens in builder
        const view = VIEW_BUILDER_NAME;
        const geolocation = null;
        // cannot add item path because it will be removed from the db
        const action: Action = new BaseAction({
          memberId: actor.id,
          memberType: member.type,
          itemPath: null,
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

  // get actions and more data matching the given `id`
  fastify.get<{ Params: IdParam; Querystring: AnalyticsQueryParams }>(
    '/items/:id',
    { schema: getItemActions },
    async ({ member, params: { id }, query: { requestedSampleSize, view } }, reply) => {
      const tasks = actionTaskManager.createGetBaseAnalyticsForItemTaskSequence(member, {
        sampleSize: requestedSampleSize,
        itemId: id,
        view,
      });
      const result = await runner.runSingleSequence(tasks);

      reply.send(result);
    },
  );

  // get actions matching the given `id`
  fastify.route<{ Params: IdParam }>({
    method: 'POST',
    url: '/items/:id/export',
    schema: exportAction,
    handler: async ({ member, params: { id: itemId }, log }, reply) => {
      // check member has admin access to the item
      const getItemTask = itemTaskManager.createGetTask(member, itemId);
      const checkAdminRightsTask =
        itemMembershipsTaskManager.createGetMemberItemMembershipTask(member);
      checkAdminRightsTask.getInput = () => ({
        validatePermission: PermissionLevel.ADMIN,
        item: getItemTask.result,
      });
      const requestExportTask = requestExportTaskManager.createGetLastTask(member, {
        memberId: member.id,
        itemId,
      });
      const requestExport = (await runner.runSingleSequence([
        getItemTask,
        checkAdminRightsTask,
        requestExportTask,
      ])) as RequestExport;
      const item = getItemTask.result as Item;

      // check if a previous request already created the file and send it back
      if (requestExport) {
        const lowerLimitDate = new Date(Date.now() - DEFAULT_REQUEST_EXPORT_INTERVAL);
        const createdAtDate = new Date(requestExport.createdAt);
        if (createdAtDate.getTime() >= lowerLimitDate.getTime()) {
          const link = createExportLinkAndSendMail({
            member,
            item,
            log,
            archiveDate: buildArchiveDateAsName(createdAtDate),
          });
          // mail was successful sent
          if (link) {
            reply.status(StatusCodes.NO_CONTENT);
            return;
          }
        }
        // the previous exported data is outdated and a new version should be uploaded
      }

      // get actions data and create archive in background
      new Promise(async () => {
        // create tmp folder to temporaly save files
        const tmpFolder = path.join(TMP_FOLDER_PATH, itemId);
        fs.mkdirSync(tmpFolder, { recursive: true });

        const createArchiveTaskSequence =
          requestExportTaskManager.createCreateAndUploadArchiveTaskSequence(member, {
            itemId,
            storageFolder: tmpFolder,
          });
        const requestExport = (await runner.runSingleSequence(
          createArchiveTaskSequence,
        )) as RequestExport;

        // delete tmp folder
        const fileStorage = buildItemTmpFolder(itemId);
        if (fs.existsSync(fileStorage)) {
          fs.rmSync(fileStorage, { recursive: true });
        } else {
          log?.error(`${fileStorage} was not found, and was not deleted`);
        }

        await createExportLinkAndSendMail({
          member,
          item,
          log,
          archiveDate: buildArchiveDateAsName(new Date(requestExport.createdAt)),
        });
      });

      // reply no content and let the server create the archive and send the mail
      reply.status(StatusCodes.NO_CONTENT);
    },
  });

  // todo: delete self data
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

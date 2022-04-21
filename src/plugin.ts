// global
import { FastifyPluginAsync } from 'fastify';
import { Item, Member, IdParam, Actor } from 'graasp';
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
import { BaseAction } from './services/action/base-action';
import { ActionService } from './services/action/db-service';
import { Action } from './interfaces/action';
import {
  ACTION_TYPES,
  DEFAULT_REQUEST_EXPORT_INTERVAL,
  EXPORT_FILE_EXPIRATION,
  MAX_ACTIONS_SAMPLE_SIZE,
  TMP_FOLDER_PATH,
  VIEW_BUILDER_NAME,
  VIEW_UNKNOWN_NAME,
  ZIP_MIMETYPE,
} from './constants/constants';
import { getOne, deleteAllById, exportAction } from './schemas/schemas';
import { BaseAnalytics } from './services/action/base-analytics';
import { AnalyticsQueryParams } from './interfaces/analytics';
import { ActionTaskManager } from './services/action/task-manager';
import { StatusCodes } from 'http-status-codes';
import { buildActionFilePath, buildItemTmpFolder, exportActionsInArchive } from './utils/export';
import { onExportSuccessFunction, UploadArchiveFunction } from './types';
import { ArchiveNotFound, EmptyActionError } from './utils/errors';
import { RequestExportTaskManager } from './services/requestExport/task-manager';
import { RequestExportService } from './services/requestExport/db-service';

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
  const actionTaskManager = new ActionTaskManager(
    actionService,
    itemTaskManager,
    itemMembershipsTaskManager,
    memberTaskManager,
    hosts,
  );

  const requestExportDS = new RequestExportService();
  const requestExportTaskManager = new RequestExportTaskManager(requestExportDS);

  const fileTaskManager = new FileTaskManager(serviceOptions, serviceMethod);

  if (!mailerPlugin) {
    throw new Error('Mailer plugin is not defined');
  }

  const createExportLinkAndSendMail = async ({ member, itemId, log, dateString }) => {
    // get download link
    const lang = member?.extra?.lang as string;
    const filepath = buildActionFilePath(itemId, dateString);
    const getDownloadLinkTask = fileTaskManager.createDownloadFileTask(member, {
      filepath,
      itemId,
      mimetype: ZIP_MIMETYPE,
      expiration: EXPORT_FILE_EXPIRATION,
    });
    const downloadLink = (await runner.runSingle(getDownloadLinkTask)) as string;

    if (!downloadLink) {
      throw new ArchiveNotFound({ filepath });
    }

    // send mail
    log.debug('send action file by mail');
    return mailer.sendActionExportEmail(member, downloadLink, lang).catch((err) => {
      log.warn(err, `mailer failed. action download link: ${downloadLink}`);
    });
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

  // get all the actions matching the given `id`
  fastify.route<{ Params: IdParam }>({
    method: 'POST',
    url: '/items/:id/export',
    schema: exportAction,
    handler: async ({ member, params: { id: itemId }, log }, reply) => {
      // check if a previous request already created the file and send it back
      try {
        const requestExportTask = requestExportTaskManager.createGetTask(member, {
          memberId: member.id,
          itemId,
        });
        const requestExport = await runner.runSingle(requestExportTask);
        const lowerLimitDate = new Date(Date.now() - DEFAULT_REQUEST_EXPORT_INTERVAL);
        const createdAtDate = new Date(requestExport.createdAt);
        if (createdAtDate.getTime() >= lowerLimitDate.getTime()) {
          createExportLinkAndSendMail({
            member,
            itemId,
            log,
            dateString: createdAtDate.toISOString(),
          });
          reply.status(StatusCodes.NO_CONTENT);
          return;
        }
      } catch (err) {
        // continue normally if the archive was not automatically found -> create a new one
        if (!(err instanceof ArchiveNotFound)) {
          throw err;
        }
      }

      // create tmp folder to temporaly save files
      const tmpFolder = path.join(TMP_FOLDER_PATH, itemId);
      fs.mkdirSync(tmpFolder, { recursive: true });

      // get actions and more data
      const tasks = actionTaskManager.createGetBaseAnalyticsForItemTaskSequence(member, {
        itemId,
        sampleSize: MAX_ACTIONS_SAMPLE_SIZE,
      });
      const baseAnalytics = (await runner.runSingleSequence(tasks)) as BaseAnalytics;

      // throws no action for itemId
      if (!baseAnalytics?.actions?.length) {
        throw new EmptyActionError(itemId);
      }

      // util function to upload the created archive
      const uploadArchive: UploadArchiveFunction = async ({ filepath, itemId, dateString }) => {
        log.debug(`upload archive for item ${itemId}`);

        const uploadFilePath = buildActionFilePath(itemId, dateString);
        const uploadTask = fileTaskManager.createUploadFileTask(member, {
          file: fs.createReadStream(filepath),
          filepath: uploadFilePath,
          mimetype: ZIP_MIMETYPE,
          size: fs.statSync(filepath).size,
        });

        await runner.runSingle(uploadTask);
      };

      // util function triggered once the archive is created
      // delete tmp folder and send link by mail
      const onSuccess: onExportSuccessFunction = async ({ itemId, dateString, timestamp }) => {
        // delete tmp folder
        const fileStorage = buildItemTmpFolder(itemId);
        if (fs.existsSync(fileStorage)) {
          fs.rmSync(fileStorage, { recursive: true });
        } else {
          log?.error(`${fileStorage} was not found, and was not deleted`);
        }

        // create request row
        const createRequestExportTask = requestExportTaskManager.createCreateTask(member, {
          itemId,
          createdAt: timestamp.getTime(),
        });
        await runner.runSingle(createRequestExportTask);

        await createExportLinkAndSendMail({ member, itemId, log, dateString });
      };

      exportActionsInArchive({
        itemId,
        tmpFolder,
        onSuccess,
        baseAnalytics,
        uploadArchive,
        views: [...hosts.map(({ name }) => name), VIEW_UNKNOWN_NAME],
      });

      // reply no content and let the server create the archive and send the mail
      reply.status(StatusCodes.NO_CONTENT);
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

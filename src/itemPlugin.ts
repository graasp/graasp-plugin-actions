import fs from 'fs';
import { StatusCodes } from 'http-status-codes';
import path from 'path';

import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

import {
  FileItemType,
  Hostname,
  IdParam,
  Item,
  LocalFileConfiguration,
  PermissionLevel,
  S3FileConfiguration,
} from '@graasp/sdk';
import { FileTaskManager } from 'graasp-plugin-file';

import {
  DEFAULT_REQUEST_EXPORT_INTERVAL,
  EXPORT_FILE_EXPIRATION,
  EXPORT_FILE_EXPIRATION_DAYS,
  TMP_FOLDER_PATH,
  ZIP_MIMETYPE,
} from './constants/constants';
import { AnalyticsQueryParams } from './interfaces/analytics';
import { RequestExport } from './interfaces/requestExport';
import { enableActions, exportAction, getItemActions } from './schemas/schemas';
import { ItemActionService } from './services/action/item/item-db-service';
import ItemActionTaskManager from './services/action/item/item-task-manager';
import { RequestExportService } from './services/requestExport/db-service';
import { RequestExportTaskManager } from './services/requestExport/task-manager';
import { buildActionFilePath, buildArchiveDateAsName, buildItemTmpFolder } from './utils/export';

export interface GraaspItemActionsOptions {
  hosts: Hostname[];
  fileItemType: FileItemType;
  fileConfigurations: { s3: S3FileConfiguration; local: LocalFileConfiguration };
}

const plugin: FastifyPluginAsync<GraaspItemActionsOptions> = async (fastify, options) => {
  const {
    items: { taskManager: itemTaskManager },
    itemMemberships: { taskManager: itemMembershipsTaskManager },
    members: { taskManager: memberTaskManager },
    taskRunner: runner,
    mailer,
  } = fastify;

  if (!mailer) {
    throw new Error('Mailer plugin is not defined');
  }

  const { fileItemType, fileConfigurations, hosts } = options;

  const itemActionService = new ItemActionService();
  const itemActionTaskManager = new ItemActionTaskManager(
    itemActionService,
    itemTaskManager,
    itemMembershipsTaskManager,
    memberTaskManager,
    hosts,
  );

  // todo: remove with file refactor
  const fileTaskManager = new FileTaskManager(fileConfigurations, fileItemType);
  const requestExportDS = new RequestExportService();
  const requestExportTaskManager = new RequestExportTaskManager(
    requestExportDS,
    itemActionTaskManager,
    fileTaskManager,
    hosts,
  );

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

  // TODO: check if it is still needed, but I don't think so
  // add CORS support
  // if (fastify.corsPluginOptions) {
  //   fastify.register(fastifyCors, fastify.corsPluginOptions);
  // }
  // fastify.addHook('preHandler', fastify.verifyAuthentication);

  // get actions and more data matching the given `id`
  fastify.get<{ Params: IdParam; Querystring: AnalyticsQueryParams }>(
    '/:id/analytics',
    { schema: getItemActions },
    async ({ member, params: { id }, query: { requestedSampleSize, view } }, reply) => {
      const tasks = itemActionTaskManager.createGetBaseAnalyticsForItemTaskSequence(member, {
        sampleSize: requestedSampleSize,
        itemId: id,
        view,
      });
      const result = await runner.runSingleSequence(tasks);

      reply.send(result);
    },
  );

  // toggle enable actions setting
  fastify.get<{ Params: IdParam; Body: boolean }>(
    '/:id/analytics/enable',
    { schema: enableActions },
    async ({ member, params: { id }, body: enableActions }) => {
      const tasks = itemActionTaskManager.createSetEnableActionsTaskSequence(
        member,
        id,
        enableActions,
      );
      return runner.runSingleSequence(tasks);
    },
  );

  // export actions matching the given `id`
  fastify.route<{ Params: IdParam }>({
    method: 'POST',
    url: '/:id/analytics/export',
    schema: exportAction,
    handler: async ({ member, params: { id: itemId }, log }, reply) => {
      // check member has admin access to the item
      const getItemTask = itemTaskManager.createGetTask(member, itemId);
      const checkAdminRightsTask =
        itemMembershipsTaskManager.createGetMemberItemMembershipTask(member);
      checkAdminRightsTask.getInput = () => ({
        validatePermission: PermissionLevel.Admin,
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
};

export default fp(plugin, {
  fastify: '3.x',
  name: 'graasp-plugin-actions-items',
});

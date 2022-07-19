import fs from 'fs';

import { Actor, Hostname, Task } from '@graasp/sdk';
import { FileTaskManager } from 'graasp-plugin-file';

import { MAX_ACTIONS_SAMPLE_SIZE, ZIP_MIMETYPE } from '../../constants/constants';
import { buildActionFilePath, buildArchiveDateAsName } from '../../utils/export';
import { BaseAnalytics } from '../action/base-analytics';
import { ActionTaskManager } from '../action/task-manager';
import { CreateArchiveTask } from './create-archive-task';
import {
  CreateRequestExportTask,
  CreateRequestExportTaskInputType,
} from './create-request-export-task';
import { RequestExportService } from './db-service';
import {
  GetLastRequestExportTask,
  GetLastRequestExportTaskInputType,
} from './get-request-export-task';

export class RequestExportTaskManager {
  requestExportService: RequestExportService;
  fileTaskManager: FileTaskManager;
  actionTaskManager: ActionTaskManager;
  hosts: Hostname[];

  constructor(
    requestExportService: RequestExportService,
    actionTaskManager: ActionTaskManager,
    fileTaskManager: FileTaskManager,
    hosts: Hostname[],
  ) {
    this.requestExportService = requestExportService;
    this.actionTaskManager = actionTaskManager;
    this.fileTaskManager = fileTaskManager;
    this.hosts = hosts;
  }

  createCreateTask(
    member: Actor,
    payload?: CreateRequestExportTaskInputType,
  ): CreateRequestExportTask {
    return new CreateRequestExportTask(member, this.requestExportService, payload);
  }

  createGetLastTask(
    member: Actor,
    payload: GetLastRequestExportTaskInputType,
  ): GetLastRequestExportTask {
    return new GetLastRequestExportTask(member, this.requestExportService, payload);
  }

  createCreateAndUploadArchiveTaskSequence(
    member: Actor,
    payload: { itemId: string; storageFolder: string },
  ): Task<Actor, unknown>[] {
    const { itemId, storageFolder } = payload;

    // get actions and more data
    const tasks = this.actionTaskManager.createGetBaseAnalyticsForItemTaskSequence(member, {
      itemId,
      sampleSize: MAX_ACTIONS_SAMPLE_SIZE,
    });

    // create archive given base analytics
    const t1 = new CreateArchiveTask(member, this.requestExportService, this.hosts);
    t1.getInput = () => ({
      baseAnalytics: tasks[tasks.length - 1].getResult() as BaseAnalytics,
      storageFolder,
    });

    // upload file task
    const uploadTask = this.fileTaskManager.createUploadFileTask(member);
    uploadTask.getInput = () => ({
      file: fs.createReadStream(t1.result.filepath),
      filepath: buildActionFilePath(itemId, buildArchiveDateAsName(t1.result.timestamp)),
      mimetype: ZIP_MIMETYPE,
      size: fs.statSync(t1.result.filepath).size,
    });

    // create request row task
    const createRequestExportTask = this.createCreateTask(member);
    createRequestExportTask.getInput = () => ({
      itemId,
      createdAt: t1.result.timestamp.getTime(),
    });

    return [...tasks, t1, uploadTask, createRequestExportTask];
  }
}

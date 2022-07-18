import { Actor, TaskStatus } from '@graasp/sdk';

import { VIEW_UNKNOWN_NAME } from '../../constants/constants';
import { Hostname } from '../../plugin';
import { ExportActionsInArchiveOutput, exportActionsInArchive } from '../../utils/export';
import { BaseAnalytics } from '../action/base-analytics';
import { BaseRequestExportTask } from './base-request-export-task';
import { RequestExportService } from './db-service';

export interface CreateArchiveTaskInputType {
  baseAnalytics?: BaseAnalytics;
  storageFolder?: string;
}

export class CreateArchiveTask extends BaseRequestExportTask<ExportActionsInArchiveOutput> {
  hosts: Hostname[];

  input: CreateArchiveTaskInputType;
  getInput: () => CreateArchiveTaskInputType;

  get name(): string {
    return CreateArchiveTask.name;
  }

  constructor(
    actor: Actor,
    requestExportService: RequestExportService,
    hosts: Hostname[],
    input?: CreateArchiveTaskInputType,
  ) {
    super(actor, requestExportService);
    this.input = input ?? {};
    this.hosts = hosts;
  }

  async run(): Promise<void> {
    this.status = TaskStatus.RUNNING;

    const { storageFolder, baseAnalytics } = this.input;

    const result = await exportActionsInArchive({
      storageFolder,
      baseAnalytics,
      // include all actions from any view
      views: [...this.hosts.map(({ name }) => name), VIEW_UNKNOWN_NAME],
    });

    this._result = result;
    this.status = TaskStatus.OK;
  }
}

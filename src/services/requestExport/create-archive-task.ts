import { Actor } from 'graasp';
import { RequestExportService } from './db-service';
import { BaseRequestExportTask } from './base-request-export-task';
import { Hostname } from '../../plugin';
import { exportActionsInArchive, ExportActionsInArchiveOutput } from '../../utils/export';
import { BaseAnalytics } from '../action/base-analytics';
import { VIEW_UNKNOWN_NAME } from '../../constants/constants';

export interface CreateArchiveTaskInputType {
  baseAnalytics: BaseAnalytics;
  storageFolder: string;
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
    this.input = input;
    this.hosts = hosts;
  }

  async run(): Promise<void> {
    this.status = 'RUNNING';

    const { storageFolder, baseAnalytics } = this.input;

    const result = await exportActionsInArchive({
      storageFolder,
      baseAnalytics,
      // include all actions from any view
      views: [...this.hosts.map(({ name }) => name), VIEW_UNKNOWN_NAME],
    });

    this._result = result;
    this.status = 'OK';
  }
}

import { Actor, DatabaseTransactionHandler } from 'graasp';
import { RequestExport } from '../../interfaces/requestExport';
import { BaseRequestExportTask } from './base-request-export-task';
import { RequestExportService } from './db-service';

export interface GetLastRequestExportTaskInputType {
  memberId: string;
  itemId: string;
}

export class GetLastRequestExportTask extends BaseRequestExportTask<RequestExport> {
  readonly itemId: string;

  input: GetLastRequestExportTaskInputType;

  get name(): string {
    return GetLastRequestExportTask.name;
  }

  constructor(
    actor: Actor,
    requestService: RequestExportService,
    input: GetLastRequestExportTaskInputType,
  ) {
    super(actor, requestService);
    this.input = input;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = 'RUNNING';

    const requestExport = await this.requestExportService.getLast(this.input, handler);

    this._result = requestExport;
    this.status = 'OK';
  }
}

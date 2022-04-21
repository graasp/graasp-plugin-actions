import { Actor, DatabaseTransactionHandler } from 'graasp';
import { RequestExport } from '../../interfaces/requestExport';
import { BaseRequestExportTask } from './base-request-export-task';
import { RequestExportService } from './db-service';

export interface GetRequestExportTaskInputType {
  memberId: string;
  itemId: string;
}

export class GetRequestExportTask extends BaseRequestExportTask<RequestExport> {
  readonly itemId: string;

  input: GetRequestExportTaskInputType;

  get name(): string {
    return GetRequestExportTask.name;
  }

  constructor(
    actor: Actor,
    actionService: RequestExportService,
    input: GetRequestExportTaskInputType,
  ) {
    super(actor, actionService);
    this.input = input;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = 'RUNNING';

    const requestExport = await this.requestExportService.get(this.input, handler);

    this._result = requestExport;
    this.status = 'OK';
  }
}

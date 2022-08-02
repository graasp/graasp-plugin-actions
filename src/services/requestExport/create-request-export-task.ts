import { Actor, DatabaseTransactionHandler, TaskStatus } from '@graasp/sdk';

import { Action } from '../../interfaces/action';
import { RequestExport } from '../../interfaces/requestExport';
import { BaseRequestExportTask } from './base-request-export-task';
import { RequestExportService } from './db-service';

export type CreateRequestExportTaskInputType = Partial<RequestExport>;

export class CreateRequestExportTask extends BaseRequestExportTask<RequestExport> {
  readonly action: Action;

  input: CreateRequestExportTaskInputType;
  getInput: () => CreateRequestExportTaskInputType;

  get name(): string {
    return CreateRequestExportTask.name;
  }

  constructor(
    actor: Actor,
    requestExportService: RequestExportService,
    input?: CreateRequestExportTaskInputType,
  ) {
    super(actor, requestExportService);
    this.input = input ?? {};
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = TaskStatus.RUNNING;

    const { itemId, createdAt } = this.input;

    const requestExport = await this.requestExportService.create(
      { memberId: this.actor.id, itemId, createdAt },
      handler,
    );

    this._result = requestExport;
    this.status = TaskStatus.OK;
  }
}

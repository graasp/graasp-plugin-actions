import { Actor, DatabaseTransactionHandler, TaskStatus } from '@graasp/sdk';

import { Action } from '../../interfaces/action';
import { BaseActionTask } from './base-action-task';
import { ActionService } from './db-service';

export class DeleteActionsTask extends BaseActionTask<Action[]> {
  readonly memberId: string;

  get name(): string {
    return DeleteActionsTask.name;
  }

  constructor(actor: Actor, memberId: string, actionService: ActionService) {
    super(actor, actionService);
    this.memberId = memberId;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = TaskStatus.RUNNING;

    // delete action
    const actionResult = await this.actionService.deleteActionsByUser(this.memberId, handler);

    this._result = actionResult;
    this.status = TaskStatus.OK;
  }
}

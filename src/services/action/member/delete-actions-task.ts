import { Action, Actor, DatabaseTransactionHandler, TaskStatus } from '@graasp/sdk';

import { BaseMemberActionTask } from './base-action-task';
import { MemberActionService } from './member-db-service';

export class DeleteActionsTask extends BaseMemberActionTask<Action[]> {
  readonly memberId: string;

  get name(): string {
    return DeleteActionsTask.name;
  }

  constructor(actor: Actor, memberId: string, memberActionService: MemberActionService) {
    super(actor, memberActionService);
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

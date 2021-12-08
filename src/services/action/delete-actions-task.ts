// global
import {
    Actor,
    DatabaseTransactionHandler,
    UnknownExtra,
  } from 'graasp';
  // local
  import { ActionService } from '../../db-service';
  import { BaseActionTask } from './base-action-task';
  import { Action } from '../../interfaces/action';
  
  
  export class DeleteActionsTask<E extends UnknownExtra> extends BaseActionTask<Action[]> {
  
    readonly memberId: string;
  
  
    get name(): string {
      return DeleteActionsTask.name;
    }
  
    constructor(actor: Actor, memberId: string, actionService: ActionService) {
      super(actor, actionService);
      this.memberId = memberId;
    }
  
    async run(handler: DatabaseTransactionHandler): Promise<void> {
      this.status = 'RUNNING';
  
      // delete action
      const actionResult = await this.actionService.deleteActionsByUser(this.memberId, handler);
  
      this._result = actionResult;
      this.status = 'OK';
    }
  }
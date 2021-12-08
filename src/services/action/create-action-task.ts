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


export class CreateActionTask<E extends UnknownExtra> extends BaseActionTask<Action> {

  readonly action: Action;


  get name(): string {
    return CreateActionTask.name;
  }

  constructor(actor: Actor, action: Action, actionService: ActionService) {
    super(actor, actionService);
    this.action = action;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = 'RUNNING';

    // save action
    const actionResult = await this.actionService.create(this.action, handler);

    this._result = actionResult;
    this.status = 'OK';
  }
}
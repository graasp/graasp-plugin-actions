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
import { views } from '../../constants/constants';


export class GetActionsTask<E extends UnknownExtra> extends BaseActionTask<Action[]> {

  readonly itemId: string;
  readonly requestedSampleSize: string | undefined;
  readonly view: string | undefined;


  get name(): string {
    return GetActionsTask.name;
  }

  constructor(actor: Actor, itemId: string, requestedSampleSize: string, view: string, actionService: ActionService) {
    super(actor, actionService);
    this.itemId = itemId;
    this.requestedSampleSize = requestedSampleSize;
    this.view = view;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = 'RUNNING';

    var actionResult = null;

    if (this.requestedSampleSize) {
      if (this.view && views.includes(this.view)) {
        actionResult = await this.actionService.getActionsByItemWithSampleAndView(this.itemId, this.requestedSampleSize, this.view, handler);
      } else {
        actionResult = await this.actionService.getActionsByItemWithSample(this.itemId, this.requestedSampleSize, handler);
      }
    } else {
      if (this.view && views.includes(this.view)) {
        actionResult = await this.actionService.getActionsByItemWithView(this.itemId, this.view, handler);
      } else {
        actionResult = await this.actionService.getActionsByItem(this.itemId, handler);
      }
    }

    this._result = actionResult;
    this.status = 'OK';
  }
}
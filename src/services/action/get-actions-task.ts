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
import { views, DEFAULT_ACTIONS_SAMPLE_SIZE, MIN_ACTIONS_SAMPLE_SIZE, MAX_ACTIONS_SAMPLE_SIZE } from '../../constants/constants';


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

    // Check validity of the requestSampleSize parameter (it is a number between min and max constants)
    var sampleSize = DEFAULT_ACTIONS_SAMPLE_SIZE;
    if (this.requestedSampleSize) {
      const requestedSampleSizeInt = parseInt(this.requestedSampleSize, 10);
      // If it is not valid, set the default value
      if (requestedSampleSizeInt == NaN) {
        sampleSize = DEFAULT_ACTIONS_SAMPLE_SIZE;
      } else {
        // If the requested number is less than the min constant, set default value
        if (requestedSampleSizeInt < MIN_ACTIONS_SAMPLE_SIZE) {
          sampleSize = DEFAULT_ACTIONS_SAMPLE_SIZE;
        // If the requested number is bigger than the max constant, set the max value
        } else if (requestedSampleSizeInt > MAX_ACTIONS_SAMPLE_SIZE) {
          sampleSize = MAX_ACTIONS_SAMPLE_SIZE.toString();
        // If the number is not between min and max, set default value
        } else {
          sampleSize = requestedSampleSizeInt.toString();
        }
      }
    }

    // Check if view parameter exits and check validity (it is one of the Graasp views)
    if (this.view && views.includes(this.view)) {
      // Get actions with requestedSampleSize
      actionResult = await this.actionService.getActionsByItemWithSampleAndView(this.itemId, sampleSize, this.view, handler);
    } else {
      // Get actions with requestedSampleSize and view
      actionResult = await this.actionService.getActionsByItemWithSample(this.itemId, sampleSize, handler);
    }

    this._result = actionResult;
    this.status = 'OK';
  }
}
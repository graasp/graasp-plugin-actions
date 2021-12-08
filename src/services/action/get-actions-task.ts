// global
import { Actor, DatabaseTransactionHandler } from 'graasp';
// local
import { ActionService } from '../../db-service';
import { BaseActionTask } from './base-action-task';
import { Action } from '../../interfaces/action';
import {
  DEFAULT_ACTIONS_SAMPLE_SIZE,
  MIN_ACTIONS_SAMPLE_SIZE,
  MAX_ACTIONS_SAMPLE_SIZE,
} from '../../constants/constants';

export class GetActionsTask extends BaseActionTask<Action[]> {
  readonly itemId: string;
  readonly requestedSampleSize: number | undefined;
  readonly view: string | undefined;

  get name(): string {
    return GetActionsTask.name;
  }

  constructor(
    actor: Actor,
    itemId: string,
    requestedSampleSize: number,
    view: string,
    actionService: ActionService,
  ) {
    super(actor, actionService);
    this.itemId = itemId;
    this.requestedSampleSize = requestedSampleSize;
    this.view = view;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = 'RUNNING';

    let actionResult = null;

    // Check validity of the requestSampleSize parameter (it is a number between min and max constants)
    let sampleSize = DEFAULT_ACTIONS_SAMPLE_SIZE;
    if (this.requestedSampleSize) {
      // If it is an integer, return the value bounded between min and max
      if (Number.isInteger(this.requestedSampleSize)) {
        sampleSize = Math.min(
          Math.max(this.requestedSampleSize, MIN_ACTIONS_SAMPLE_SIZE),
          MAX_ACTIONS_SAMPLE_SIZE,
        );
        // If it is not valid, set the default value
      } else {
        sampleSize = DEFAULT_ACTIONS_SAMPLE_SIZE;
      }
    }

    // Check if view parameter exits. If it is provided an incorrect view, it would be undefined
    if (this.view) {
      // Get actions with requestedSampleSize
      actionResult = await this.actionService.getActionsByItemWithSampleAndView(
        this.itemId,
        sampleSize,
        this.view,
        handler,
      );
    } else {
      // Get actions with requestedSampleSize and view
      actionResult = await this.actionService.getActionsByItemWithSample(
        this.itemId,
        sampleSize,
        handler,
      );
    }

    this._result = actionResult;
    this.status = 'OK';
  }
}

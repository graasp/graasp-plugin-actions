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

export interface GetActionsTaskInputType {
  requestedSampleSize?: number;
  view?: string;
}

export class GetActionsTask extends BaseActionTask<Action[]> {
  readonly itemId: string;

  input: GetActionsTaskInputType;

  get name(): string {
    return GetActionsTask.name;
  }

  constructor(
    actor: Actor,
    actionService: ActionService,
    itemId: string,
    input: GetActionsTaskInputType,
  ) {
    super(actor, actionService);
    this.itemId = itemId;
    this.input = input ?? {};
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = 'RUNNING';

    const { requestedSampleSize, view } = this.input;

    // Check validity of the requestSampleSize parameter (it is a number between min and max constants)
    let sampleSize = DEFAULT_ACTIONS_SAMPLE_SIZE;
    if (requestedSampleSize) {
      // If it is an integer, return the value bounded between min and max
      if (Number.isInteger(requestedSampleSize)) {
        sampleSize = Math.min(
          Math.max(requestedSampleSize, MIN_ACTIONS_SAMPLE_SIZE),
          MAX_ACTIONS_SAMPLE_SIZE,
        );
        // If it is not valid, set the default value
      } else {
        sampleSize = DEFAULT_ACTIONS_SAMPLE_SIZE;
      }
    }

    let actionResult = null;
    // Check if view parameter exits. If it is provided an incorrect view, it would be undefined
    if (view) {
      // Get actions with requestedSampleSize and view
      actionResult = await this.actionService.getActionsByItemWithSampleAndView(
        this.itemId,
        sampleSize,
        view,
        handler,
      );
    } else {
      // Get actions with requestedSampleSize
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

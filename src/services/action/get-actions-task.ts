import { Actor, DatabaseTransactionHandler, TaskStatus } from '@graasp/sdk';

import {
  DEFAULT_ACTIONS_SAMPLE_SIZE,
  MAX_ACTIONS_SAMPLE_SIZE,
  MIN_ACTIONS_SAMPLE_SIZE,
} from '../../constants/constants';
import { Action } from '../../interfaces/action';
import { BaseActionTask } from './base-action-task';
import { ActionService } from './db-service';

export interface GetActionsTaskInputType {
  itemPath?: string;
  sampleSize?: number;
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
    input?: GetActionsTaskInputType,
  ) {
    super(actor, actionService);
    this.itemId = itemId;
    this.input = input ?? {};
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = TaskStatus.RUNNING;

    const { sampleSize, view, itemPath } = this.input;

    if (!itemPath) {
      throw new Error('');
    }

    // Check validity of the requestSampleSize parameter (it is a number between min and max constants)
    let size = DEFAULT_ACTIONS_SAMPLE_SIZE;
    if (sampleSize) {
      // If it is an integer, return the value bounded between min and max
      if (Number.isInteger(sampleSize)) {
        size = Math.min(Math.max(sampleSize, MIN_ACTIONS_SAMPLE_SIZE), MAX_ACTIONS_SAMPLE_SIZE);
        // If it is not valid, set the default value
      } else {
        size = DEFAULT_ACTIONS_SAMPLE_SIZE;
      }
    }

    let actionResult = null;
    // Get actions with requestedSampleSize and view
    actionResult = await this.actionService.getActionsByItem(
      itemPath,
      {
        sampleSize: size,
        view,
      },
      handler,
    );

    this._result = actionResult;
    this.status = TaskStatus.OK;
  }
}

import { Actor } from '@graasp/sdk';

import { ActionService } from './db-service';
import { DeleteActionsTask } from './delete-actions-task';

// action task manager shouldn't depend on the other task manager
// we want to define a generic action task manager before defining the other ones
export class MemberActionTaskManager {
  //implements TaskManager
  actionService: ActionService;

  constructor(actionService: ActionService) {
    this.actionService = actionService;
  }

  createDeleteTask(member: Actor, memberId: string): DeleteActionsTask {
    return new DeleteActionsTask(member, memberId, this.actionService);
  }
}

export default MemberActionTaskManager;

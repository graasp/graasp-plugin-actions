import { Actor, MemberTaskManager, Task } from '@graasp/sdk';

import { DeleteActionsTask } from './delete-actions-task';
import { MemberActionService } from './member-db-service';

// action task manager shouldn't depend on the other task manager
// we want to define a generic action task manager before defining the other ones
export class MemberActionTaskManager {
  //implements TaskManager
  actionService: MemberActionService;
  memberTaskManager: MemberTaskManager;

  constructor(actionService: MemberActionService, memberTaskManager: MemberTaskManager) {
    this.actionService = actionService;
    this.memberTaskManager = memberTaskManager;
  }

  createDeleteTask(member: Actor, memberId: string): DeleteActionsTask {
    return new DeleteActionsTask(member, memberId, this.actionService);
  }

  createSetEnableActionsTaskSequence(
    member: Actor,
    enableActions: boolean,
  ): Task<Actor, unknown>[] {
    return this.memberTaskManager.createUpdateTaskSequence(member, member.id, {
      extra: { enableActions },
    });
  }
}

export default MemberActionTaskManager;

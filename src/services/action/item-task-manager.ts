import {
  Action,
  Actor,
  Hostname,
  Item,
  ItemMembership,
  ItemMembershipTaskManager,
  ItemService,
  ItemTaskManager,
  Member,
  MemberTaskManager,
  Task,
} from '@graasp/sdk';

import { PermissionLevel } from '../../constants/constants';
import { BaseAnalytics } from './base-analytics';
import { ActionService } from './db-service';
import { DeleteActionsTask } from './delete-actions-task';
import { GetActionsTask, GetActionsTaskInputType } from './get-actions-task';

// action task manager shouldn't depend on the other task manager
// we want to define a generic action task manager before defining the other ones
export class ItemActionTaskManager {
  //implements TaskManager
  actionService: ActionService;
  itemService: ItemService;
  itemTaskManager: ItemTaskManager;
  memberTaskManager: MemberTaskManager;
  itemMembershipsTaskManager: ItemMembershipTaskManager;
  hosts: Hostname[];

  constructor(
    actionService: ActionService,
    itemTaskManager: ItemTaskManager,
    itemMembershipsTaskManager: ItemMembershipTaskManager,
    memberTaskManager: MemberTaskManager,
    hosts: Hostname[],
  ) {
    this.actionService = actionService;
    this.hosts = hosts;
    this.itemTaskManager = itemTaskManager;
    this.itemMembershipsTaskManager = itemMembershipsTaskManager;
    this.memberTaskManager = memberTaskManager;
  }

  // TODO: should get latest and not random actions!!
  createGetActionsTaskSequence(
    member: Actor,
    itemId: string,
    payload: GetActionsTaskInputType,
  ): Task<Actor, unknown>[] {
    // get item
    const getItemTask = this.itemTaskManager.createGetTask(member, itemId);

    // check member has admin membership over item
    const checkMembershipTask =
      this.itemMembershipsTaskManager.createGetMemberItemMembershipTask(member);
    checkMembershipTask.getInput = () => ({
      item: getItemTask.result,
      validatePermission: PermissionLevel.ADMIN,
    });

    // get actions
    const getActionsTask = new GetActionsTask(member, this.actionService, itemId);
    getActionsTask.getInput = () => ({
      itemPath: getItemTask.result.path,
      ...payload,
    });
    return [getItemTask, checkMembershipTask, getActionsTask];
  }

  createGetBaseAnalyticsForItemTaskSequence(
    member: Actor,
    payload: { itemId: string; sampleSize: number; view?: string },
  ): Task<Actor, unknown>[] {
    // check membership and get actions
    const [getTask, checkMembershipTask, getActionsTask] = this.createGetActionsTaskSequence(
      member,
      payload.itemId,
      payload,
    );

    // get memberships
    const getMembershipsTaskSequence = this.itemMembershipsTaskManager.createGetOfItemTaskSequence(
      member,
      payload.itemId,
    );

    // get members
    const getMembersTask = this.memberTaskManager.createGetManyTask(member);
    getMembersTask.getInput = () => {
      const memberships = getMembershipsTaskSequence[getMembershipsTaskSequence.length - 1]
        .result as ItemMembership[];
      return {
        memberIds: memberships.map(({ memberId }) => memberId),
      };
    };

    // get descendants items
    const getDescendantsTask = this.itemTaskManager.createGetDescendantsTask(member);
    getDescendantsTask.getInput = () => ({
      item: getTask.result,
    });

    // set all data in last task's result
    getActionsTask.getResult = () => {
      const actions = getActionsTask.result as Action[];
      return new BaseAnalytics({
        item: getTask.result as Item,
        descendants: getDescendantsTask.result as Item[],
        actions,
        members: getMembersTask.result as Member[],
        itemMemberships: getMembershipsTaskSequence[getMembershipsTaskSequence.length - 1]
          .result as ItemMembership[],
        metadata: {
          numActionsRetrieved: actions.length,
          requestedSampleSize: payload.sampleSize,
        },
      });
    };

    return [
      getTask,
      checkMembershipTask,
      ...getMembershipsTaskSequence,
      getMembersTask,
      getDescendantsTask,
      getActionsTask,
    ];
  }

  createDeleteTask(member: Actor, memberId: string): DeleteActionsTask {
    return new DeleteActionsTask(member, memberId, this.actionService);
  }
}

export default ItemActionTaskManager;

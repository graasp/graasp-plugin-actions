import { CreateActionTask } from './services/action/create-action-task';
// global
import {
  Actor,
  Item,
  ItemMembership,
  ItemMembershipTaskManager,
  ItemTaskManager,
  Member,
  MemberTaskManager,
  Task,
} from 'graasp';

import { ActionService } from './db-service';
import { FastifyReply, FastifyRequest } from 'fastify';
import { DeleteActionsTask } from './services/action/delete-actions-task';
import { Hostname } from './plugin';
import { ActionHandler } from './types';
import { GetActionsTask, GetActionsTaskInputType } from './services/action/get-actions-task';
import { BaseAnalytics } from './services/action/base-analytics';
import { Action } from './interfaces/action';

export class ActionTaskManager {
  actionService: ActionService;
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
    this.memberTaskManager = memberTaskManager
  }

  createCreateTask(
    member: Actor,
    payload: { request: FastifyRequest; reply: FastifyReply; handler: ActionHandler },
  ): CreateActionTask {
    return new CreateActionTask(member, this.actionService, this.hosts, payload);
  }

  createGetActionsTask(
    member: Actor,
    itemId: string,
    payload: GetActionsTaskInputType,
  ): GetActionsTask {
    return new GetActionsTask(member, this.actionService, itemId, payload);
  }

  createGetBaseAnalyticsForItemTaskSequence(
    member: Actor,
    payload: { itemId: string; sampleSize: number, view?: string },
  ): Task<Actor, unknown>[] {
    // get item
    const getTask = this.itemTaskManager.createGetTask(member, payload.itemId);

    // check member has admin membership over item
    const checkMembershipTask =
      this.itemMembershipsTaskManager.createGetMemberItemMembershipTask(member);
    checkMembershipTask.getInput = () => ({
      item: getTask.getResult(),
      // todo: use graasp PermissionLevel
      validatePermission: 'admin',
    });

    // get memberships
    const getMembershipsTaskSequence = this.itemMembershipsTaskManager.createGetOfItemTaskSequence(member, payload.itemId);

    // get members
    const getMembersTask = this.memberTaskManager.createGetManyTask(member);
    getMembersTask.getInput = () => {
      const memberships = getMembershipsTaskSequence[getMembershipsTaskSequence.length - 1].result as ItemMembership[]
      return {
        memberIds: memberships.map(({ memberId }) => memberId)
      };
    };

    // get actions
    // TODO: should get latest and not random actions!!
    const getActionsTask = new GetActionsTask(member, this.actionService, payload.itemId, {
      requestedSampleSize: payload.sampleSize, view: payload.view
    });

    // set all data in last task's result
    getActionsTask.getResult = () => {
      const actions = getActionsTask.result as Action[];
      return new BaseAnalytics({
        item: getTask.result,
        actions,
        members: getMembersTask.result as Member[],
        itemMemberships: getMembershipsTaskSequence[getMembershipsTaskSequence.length - 1].result as ItemMembership[],
        metadata: {
          numActionsRetrieved: actions.length,
          requestedSampleSize: payload.sampleSize,
        },
      });
    };

    return [getTask, checkMembershipTask, ...getMembershipsTaskSequence, getMembersTask, getActionsTask];
  }

  createDeleteTask(member: Actor, id: string): DeleteActionsTask {
    return new DeleteActionsTask(member, id, this.actionService);
  }
}

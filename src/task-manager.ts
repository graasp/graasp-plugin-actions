import { CreateActionTask } from './services/action/create-action-task';
// global
import {
  Actor,
  Item,
  ItemMembershipTaskManager,
  ItemTaskManager,
  PermissionLevel,
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
  itemMembershipsTaskManager: ItemMembershipTaskManager;
  hosts: Hostname[];

  constructor(
    actionService: ActionService,
    itemTaskManager: ItemTaskManager,
    itemMembershipsTaskManager: ItemMembershipTaskManager,
    hosts: Hostname[],
  ) {
    this.actionService = actionService;
    this.hosts = hosts;
    this.itemTaskManager = itemTaskManager;
    this.itemMembershipsTaskManager = itemMembershipsTaskManager;
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
    payload: { itemId: string; sampleSize: number },
  ): Task<Actor, unknown>[] {
    // get item
    const getTasks = this.itemTaskManager.createGetTaskSequence(member, payload.itemId);

    // check member has admin membership over item
    const membershipTask =
      this.itemMembershipsTaskManager.createGetMemberItemMembershipTask(member);
    membershipTask.getInput = () => ({
      item: getTasks[getTasks.length - 1].getResult(),
      // todo: use graasp PermissionLevel
      validatePermission: 'admin',
    });

    // todo: get all actions? will depend on subscription?
    // TODO: should get latest and not random actions!!
    const getActionsTask = new GetActionsTask(member, this.actionService, payload.itemId, {
      requestedSampleSize: payload.sampleSize,
    });

    // set all data in last task's result
    getActionsTask.getResult = () => {
      const actions = getActionsTask.result as Action[];
      return new BaseAnalytics({
        item: getTasks[getTasks.length - 1].result as Item,
        actions,
        members: [],
        metadata: {
          numActionsRetrieved: actions.length,
          requestedSampleSize: payload.sampleSize,
        },
      });
    };

    return [...getTasks, membershipTask, getActionsTask];
  }

  createDeleteTask(member: Actor, id: string): DeleteActionsTask {
    return new DeleteActionsTask(member, id, this.actionService);
  }
}

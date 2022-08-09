import { FastifyReply, FastifyRequest } from 'fastify';

import { ActionBuilder, Actor, Hostname, ActionTaskManager as TaskManager } from '@graasp/sdk';

import { CreateActionTask } from './create-action-task';
import { ActionService } from './db-service';

// action task manager shouldn't depend on the other task manager
// we want to define a generic action task manager before defining the other ones
export class ActionTaskManager implements TaskManager {
  // implements TaskManager
  actionService: ActionService;
  hosts: Hostname[];

  constructor(actionService: ActionService, hosts: Hostname[]) {
    this.actionService = actionService;
    this.hosts = hosts;
  }

  createCreateTask(
    member: Actor,
    payload: { request: FastifyRequest; reply: FastifyReply; actionBuilder: ActionBuilder },
  ): CreateActionTask {
    return new CreateActionTask(member, this.actionService, this.hosts, payload);
  }
}

export default ActionTaskManager;

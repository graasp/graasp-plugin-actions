import { CreateActionTask } from './services/action/create-action-task';
// global
import { Actor } from 'graasp';

import { ActionService } from './db-service';
import { FastifyReply, FastifyRequest } from 'fastify';
import { DeleteActionsTask } from './services/action/delete-actions-task';
import { Hostname } from './plugin';
import { ActionHandler } from './types';

export class ActionTaskManager {
  actionService: ActionService;
  hosts: Hostname[];

  constructor(actionService: ActionService, hosts: Hostname[]) {
    this.actionService = actionService;
    this.hosts = hosts;
  }

  createCreateTask(
    member: Actor,
    payload: { request: FastifyRequest; reply: FastifyReply, handler?: ActionHandler},
  ): CreateActionTask {
    return new CreateActionTask(member, this.actionService, this.hosts, payload);
  }

  createDeleteTask(member: Actor, id: string): DeleteActionsTask {
    return new DeleteActionsTask(member, id, this.actionService);
  }
}

import { CreateActionTask } from './services/action/create-action-task';
// global
import { Actor, ItemService } from 'graasp';

import { ActionService } from './db-service';
import { FastifyReply, FastifyRequest } from 'fastify';
import { DeleteActionsTask } from './services/action/delete-actions-task';
import { Hostname } from './plugin';

export class ActionTaskManager {
  actionService: ActionService;
  itemService: ItemService;
  hosts: Hostname[];

  constructor(actionService: ActionService, itemService: ItemService, hosts: Hostname[]) {
    this.actionService = actionService;
    this.itemService = itemService;
    this.hosts = hosts;
  }

  createCreateTask(
    member: Actor,
    payload: { request: FastifyRequest; reply: FastifyReply },
  ): CreateActionTask {
    console.log('taskmanager', payload.request)
    return new CreateActionTask(member, this.actionService, this.itemService, this.hosts, payload);
  }

  createDeleteTask(member: Actor, id: string): DeleteActionsTask {
    return new DeleteActionsTask(member, id, this.actionService);
  }
}

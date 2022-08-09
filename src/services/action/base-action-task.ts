import { FastifyLoggerInstance } from 'fastify';

import { Actor, DatabaseTransactionHandler, ItemService, Task, TaskStatus } from '@graasp/sdk';

import { ActionService } from './db-service';

export abstract class BaseActionTask<R> implements Task<Actor, R> {
  protected actionService: ActionService;
  protected itemService: ItemService;
  protected _result;
  protected _message: string;

  readonly actor: Actor;

  status: TaskStatus;
  targetId: string;
  skip?: boolean;

  input: unknown;
  getInput: () => unknown;

  getResult: () => unknown;

  constructor(actor: Actor, actionService: ActionService, itemService: ItemService) {
    this.actor = actor;
    this.actionService = actionService;
    this.itemService = itemService;
    this.status = TaskStatus.NEW;
  }

  abstract get name(): string;
  get result(): R {
    return this._result;
  }
  get message(): string {
    return this._message;
  }

  abstract run(
    handler: DatabaseTransactionHandler,
    log: FastifyLoggerInstance,
  ): Promise<void | BaseActionTask<R>[]>;
}

import { FastifyLoggerInstance } from 'fastify';

import { Actor, DatabaseTransactionHandler, Task, TaskStatus } from '@graasp/sdk';

import { ItemActionService } from './item-db-service';

export abstract class BaseItemActionTask<R> implements Task<Actor, R> {
  protected actionService: ItemActionService;
  protected _result;
  protected _message: string;

  readonly actor: Actor;

  status: TaskStatus;
  targetId: string;
  skip?: boolean;

  input: unknown;
  getInput: () => unknown;

  getResult: () => unknown;

  constructor(actor: Actor, actionService: ItemActionService) {
    this.actor = actor;
    this.actionService = actionService;
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
  ): Promise<void | BaseItemActionTask<R>[]>;
}

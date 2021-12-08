// global
import { FastifyLoggerInstance } from 'fastify';
import { Actor, DatabaseTransactionHandler, ItemService } from 'graasp';
import { Task, TaskStatus } from 'graasp';
// local

export abstract class BaseItemTask<R> implements Task<Actor, R> {
  protected itemService: ItemService;
  protected _result: R;
  protected _message: string;

  readonly actor: Actor;

  status: TaskStatus;
  targetId: string;
  skip?: boolean;

  input: unknown;
  getInput: () => unknown;

  getResult: () => unknown;

  constructor(actor: Actor, itemService: ItemService) {
    this.actor = actor;
    this.itemService = itemService;
    this.status = 'NEW';
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
  ): Promise<void | BaseItemTask<R>[]>;
}
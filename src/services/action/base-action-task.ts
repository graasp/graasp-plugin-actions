// global
import { FastifyLoggerInstance } from 'fastify';
import { Actor, DatabaseTransactionHandler } from 'graasp';
import { Task, TaskStatus } from 'graasp';
// local
import { ActionService } from '../../db-service';

export abstract class BaseActionTask<R> implements Task<Actor, R> {
  protected actionService: ActionService;
  protected _result;
  protected _message: string;

  readonly actor: Actor;

  status: TaskStatus;
  targetId: string;
  skip?: boolean;

  input: unknown;
  getInput: () => unknown;

  getResult: () => unknown;

  constructor(actor: Actor, actionService: ActionService) {
    this.actor = actor;
    this.actionService = actionService;
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
  ): Promise<void | BaseActionTask<R>[]>;
}

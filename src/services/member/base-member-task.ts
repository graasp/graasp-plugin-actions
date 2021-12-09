// global
import { FastifyLoggerInstance } from 'fastify';
import { Task, TaskStatus, Actor, DatabaseTransactionHandler } from 'graasp';

export abstract class BaseMemberTask<R> implements Task<Actor, R> {
  
  protected _result;
  protected _message: string;

  readonly actor: Actor;

  status: TaskStatus;
  targetId: string;

  constructor(actor: Actor) {
    this.actor = actor;
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
  ): Promise<void | BaseMemberTask<R>[]>;
}
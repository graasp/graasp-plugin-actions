// global
import { FastifyLoggerInstance } from 'fastify';
import { Actor, DatabaseTransactionHandler } from 'graasp';
import { Task, TaskStatus, ItemMembershipService } from 'graasp';


export abstract class BaseItemMembershipTask<R> implements Task<Actor, R> {
  protected itemMembershipService: ItemMembershipService;
  protected _result;
  protected _message: string;

  readonly actor: Actor;

  status: TaskStatus;
  targetId: string;
  skip?: boolean;

  input: unknown;
  getInput: () => unknown;

  getResult: () => unknown;

  constructor(actor: Actor, itemMembershipService: ItemMembershipService) {
    this.actor = actor;
    this.itemMembershipService = itemMembershipService;
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
  ): Promise<void | BaseItemMembershipTask<R>[]>;
}

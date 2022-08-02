import { FastifyLoggerInstance } from 'fastify';

import { Actor, DatabaseTransactionHandler } from '@graasp/sdk';
import { Task, TaskStatus } from '@graasp/sdk';

import { RequestExportService } from './db-service';

export abstract class BaseRequestExportTask<R> implements Task<Actor, R> {
  protected requestExportService: RequestExportService;
  protected _result;
  protected _message: string;

  readonly actor: Actor;

  status: TaskStatus;
  targetId: string;
  skip?: boolean;

  input: unknown;
  getInput: () => unknown;

  getResult: () => unknown;

  constructor(actor: Actor, requestExportService: RequestExportService) {
    this.actor = actor;
    this.requestExportService = requestExportService;
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
  ): Promise<void | BaseRequestExportTask<R>[]>;
}

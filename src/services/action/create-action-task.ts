import { FastifyLoggerInstance, FastifyReply, FastifyRequest } from 'fastify';

import { Actor, DatabaseTransactionHandler, Hostname, TaskStatus } from '@graasp/sdk';

import { Action } from '../../interfaces/action';
import { ActionHandler, ActionHandlerInput } from '../../types';
import { BaseActionTask } from './base-action-task';
import { ActionService } from './db-service';

interface InputType {
  request: FastifyRequest;
  reply: FastifyReply;
  handler: ActionHandler;
}

export class CreateActionTask extends BaseActionTask<Action> {
  readonly action: Action;
  hosts: Hostname[];

  input: InputType;
  getInput: () => InputType;

  get name(): string {
    return CreateActionTask.name;
  }

  constructor(actor: Actor, actionService: ActionService, hosts: Hostname[], input: InputType) {
    super(actor, actionService);
    this.input = input;
    this.hosts = hosts;
  }

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = TaskStatus.RUNNING;

    log.debug('create action');

    const { request, reply, handler: generateActions } = this.input;

    // create action only on successful requests
    if (reply.statusCode >= 200 && reply.statusCode < 300) {
      const actionInput: ActionHandlerInput = {
        request,
        reply,
        dbHandler: handler,
        log,
      };
      const actions = await generateActions(actionInput);
      // save action
      this._result = await Promise.all(
        actions.map(async (action) => {
          const actionResult = await this.actionService.create(action, handler);
          return actionResult;
        }),
      );
    } else {
      this._result = null;
      log.debug('action not created for failed requests');
    }
    this.status = TaskStatus.OK;
  }
}

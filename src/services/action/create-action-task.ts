import merge from 'lodash.merge';

import { FastifyLoggerInstance, FastifyReply, FastifyRequest } from 'fastify';

import {
  Action,
  ActionBuilder,
  Actor,
  DatabaseTransactionHandler,
  Hostname,
  TaskStatus,
} from '@graasp/sdk';

import { getBaseAction } from '../../utils/actions';
import { BaseAction } from './base-action';
import { BaseActionTask } from './base-action-task';
import { ActionService } from './db-service';

interface InputType {
  request: FastifyRequest;
  reply: FastifyReply;
  actionBuilder: ActionBuilder;
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

    const { request, reply, actionBuilder: generateActions } = this.input;

    // create action only on successful requests
    if (reply.statusCode >= 200 && reply.statusCode < 300) {
      const actionInput = {
        request,
        reply,
        handler,
        log,
      };

      // generate actions given custom handler
      const actionsToSave = await generateActions(actionInput);

      // get general data for actions
      const baseAction = getBaseAction(request, this.hosts);

      // merge action data, and add item type and path
      // public action??
      const actions = await Promise.all(
        actionsToSave.map(async (action) => {
          return new BaseAction(merge(baseAction, action));
        }),
      );

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

import merge from 'lodash.merge';

import { FastifyLoggerInstance, FastifyReply, FastifyRequest } from 'fastify';

import {
  Action,
  ActionHandler,
  Actor,
  DatabaseTransactionHandler,
  Hostname,
  ItemService,
  TaskStatus,
} from '@graasp/sdk';

import { getBaseAction } from '../../utils/actions';
import { BaseAction } from './base-action';
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

  constructor(
    actor: Actor,
    actionService: ActionService,
    itemService: ItemService,
    hosts: Hostname[],
    input: InputType,
  ) {
    super(actor, actionService, itemService);
    this.input = input;
    this.hosts = hosts;
  }

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = TaskStatus.RUNNING;

    log.debug('create action');

    const { request, reply, handler: generateActions } = this.input;

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
          // warning: no check over membership !
          const itemId = action.extra.itemId as string;
          let item;
          if (itemId) {
            item = await this.itemService.get(itemId, handler);
          }
          return new BaseAction(
            merge(baseAction, action, {
              itemType: item?.type,
              itemPath: item?.path,
            }),
          );
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

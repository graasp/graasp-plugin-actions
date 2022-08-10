import { v4 } from 'uuid';

import fastify, { FastifyLoggerInstance } from 'fastify';

import {
  ActionBuilder,
  ActionType,
  Context,
  DatabaseTransactionHandler,
  ItemService,
  MemberType,
} from '@graasp/sdk';
import { TaskRunner, buildItem } from 'graasp-test';

import {
  CLIENT_HOSTS,
  CREATE_ACTION_WAIT_TIME,
  GRAASP_ACTOR,
  ITEM_TYPE,
} from '../../../test/constants';
import { ActionService } from './db-service';
import { ActionTaskManager } from './task-manager';

const itemService = {
  get: jest.fn(),
} as unknown as ItemService;
const runner = new TaskRunner();

const actionService = new ActionService();
const log = {
  debug: jest.fn(),
} as unknown as FastifyLoggerInstance;
const handler = {} as DatabaseTransactionHandler;
const actionTaskManager = new ActionTaskManager(actionService, CLIENT_HOSTS);
const generateActionsHandler: ActionBuilder = () =>
  Promise.all([
    {
      memberId: v4(),
      memberType: MemberType.Individual,
      itemType: ITEM_TYPE,
      actionType: ActionType.CREATE_ITEM,
      view: Context.BUILDER,
      geolocation: undefined,
      extra: {},
      itemPath: v4().replace(/-/, '_'),
    },
  ]);

// simplified core app using create action task on response
const build = async (args: { method: string; url: string; shouldThrow?: boolean }) => {
  const { method, url, shouldThrow } = args;
  const app = fastify();
  // app.addSchema(schemas);
  app.decorateRequest('member', GRAASP_ACTOR);

  app.decorate('taskRunner', runner);

  app.addHook('onResponse', async (request, reply) => {
    if (request.member) {
      const createActionTask = actionTaskManager.createCreateTask(request.member, {
        request,
        reply,
        actionBuilder: generateActionsHandler,
      });
      await runner.runSingle(createActionTask, log);
    }
  });

  // dynamically register endpoint
  app[method.toLowerCase()](url, async () => {
    if (shouldThrow) throw new Error();

    return true;
  });

  return app;
};

describe('Create Action Task', () => {
  beforeEach(() => {
    jest.spyOn(runner, 'runSingle').mockImplementation(async (task) => {
      return task.run(handler, log);
    });
    jest.spyOn(actionTaskManager, 'createCreateTask');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('save action if request ok', async () => {
    const item = buildItem();
    const method = 'GET';
    const buildUrl = (id) => `/items/${id}`;
    const app = await build({ method, url: buildUrl(':id') });

    const mockCreateAction = jest.spyOn(actionService, 'create');
    jest.spyOn(itemService, 'get').mockImplementation(async () => item);

    // type fix: pass individually request's params
    await app.inject({ method, url: buildUrl(item.id) });
    await new Promise((r) => setTimeout(r, CREATE_ACTION_WAIT_TIME));

    expect(mockCreateAction).toHaveBeenCalled();
  });

  it('does not save action if request rejects', async () => {
    const item = buildItem();
    const method = 'GET';
    const buildUrl = (id) => `/items/${id}`;
    const app = await build({ method, url: buildUrl(':id'), shouldThrow: true });

    const mockCreateAction = jest.spyOn(actionService, 'create');
    jest.spyOn(itemService, 'get').mockImplementation(async () => item);

    // type fix: pass individually request's params
    await app.inject({ method, url: buildUrl(item.id) });
    await new Promise((r) => setTimeout(r, CREATE_ACTION_WAIT_TIME));

    expect(mockCreateAction).not.toHaveBeenCalled();
  });
});

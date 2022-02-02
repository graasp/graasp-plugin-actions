import fastify, { FastifyLoggerInstance, FastifyRequest } from 'fastify';
import { DatabaseTransactionHandler, ItemService } from 'graasp';
import qs from 'qs';
import { v4 } from 'uuid';
import { ItemMembershipTaskManager, ItemTaskManager, TaskRunner } from 'graasp-test';
import { CLIENT_HOSTS, CREATE_ACTION_WAIT_TIME, GRAASP_ACTOR } from '../../../test/constants';
import { ActionService } from '../../db-service';
import { ActionTaskManager } from '../../task-manager';
import { ACTION_TYPES } from '../../constants/constants';
import { checkActionData, getDummyItem } from '../../../test/utils';
import { buildActionsFromRequest } from './create-action-task';

const itemTaskManager = new ItemTaskManager();
const itemService = {
  get: jest.fn(),
} as unknown as ItemService;
const itemMembershipTaskManager = new ItemMembershipTaskManager();
const runner = new TaskRunner();

const actionService = new ActionService();
const log = {
  debug: jest.fn(),
} as unknown as FastifyLoggerInstance;
const handler = {} as DatabaseTransactionHandler;
const actionTaskManager = new ActionTaskManager(actionService, itemService, CLIENT_HOSTS);

// simplified core app using create action task on response
const build = async (args: { method: string, url: string, shouldThrow?: boolean }) => {
  const { method, url, shouldThrow } = args;
  const app = fastify();
  // app.addSchema(schemas);
  app.decorateRequest('member', GRAASP_ACTOR);

  app.decorate('taskRunner', runner);
  app.decorate('items', {
    taskManager: itemTaskManager,
  });
  app.decorate('itemMemberships', {
    taskManager: itemMembershipTaskManager,
  });

  app.addHook('onResponse', async (request, reply) => {
    if (request.member) {
      const createActionTask = actionTaskManager.createCreateTask(request.member, {
        request,
        reply,
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

  it('check geolocation and view properties', async () => {
    const item = getDummyItem();
    const request = {
      url: `/items/${item.id}`,
      method: 'GET',
      member: GRAASP_ACTOR,
      params: {},
      query: {},
      ip: '192.158.1.38',
      headers: { origin: `https://${CLIENT_HOSTS[0].hostname}` },
    } as unknown as FastifyRequest;
    const getItemFromDb = async () => item;
    const hosts = CLIENT_HOSTS;

    const actions = await buildActionsFromRequest(request, getItemFromDb, hosts, log);
    expect(actions[0].geolocation).toBeTruthy();
    expect(actions[0].view).toEqual(CLIENT_HOSTS[0].name);
  });

  it('does not save action if request rejects', async () => {
    const item = getDummyItem();
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

  it('does not save action if request does not match any path', async () => {
    const item = getDummyItem();
    const method = 'GET';
    const url = '/hello';
    const app = await build({ method, url, shouldThrow: true });

    const mockCreateAction = jest.spyOn(actionService, 'create');
    jest.spyOn(itemService, 'get').mockImplementation(async () => item);

    // type fix: pass individually request's params
    await app.inject({ method, url });
    await new Promise((r) => setTimeout(r, CREATE_ACTION_WAIT_TIME));

    expect(mockCreateAction).not.toHaveBeenCalled();
  });

  it('GET an item', async () => {
    const item = getDummyItem();
    const method = 'GET';
    const buildUrl = (id) => `/items/${id}`;
    const app = await build({ method, url: buildUrl(':id') });

    const mockCreateAction = jest.spyOn(actionService, 'create');
    jest.spyOn(itemService, 'get').mockImplementation(async () => item);

    // type fix: pass individually request's params
    await app.inject({ method, url: buildUrl(item.id) });
    await new Promise((r) => setTimeout(r, CREATE_ACTION_WAIT_TIME));

    expect(mockCreateAction).toHaveBeenCalled();
    const savedAction = mockCreateAction.mock.calls[0][0];
    checkActionData(savedAction, {
      itemId: item.id,
      itemType: item.type,
      actionType: ACTION_TYPES.GET,
    });
  });

  it('GET children', async () => {
    const item = getDummyItem();
    const method = 'GET';
    const buildUrl = (id) => `/items/${id}/children`;
    const app = await build({ method, url: buildUrl(':id') });

    const mockCreateAction = jest.spyOn(actionService, 'create');
    jest.spyOn(itemService, 'get').mockImplementation(async () => item);

    // type fix: pass individually request's params
    await app.inject({ method, url: buildUrl(item.id) });
    await new Promise((r) => setTimeout(r, CREATE_ACTION_WAIT_TIME));

    expect(mockCreateAction).toHaveBeenCalled();
    const savedAction = mockCreateAction.mock.calls[0][0];
    checkActionData(savedAction, {
      itemId: item.id,
      itemType: item.type,
      actionType: ACTION_TYPES.GET_CHILDREN,
    });
  });

  it('POST copy item', async () => {
    const item = getDummyItem();
    const method = 'POST';
    const buildUrl = (id) => `/items/${id}/copy`;
    const app = await build({ method, url: buildUrl(':id') });

    const mockCreateAction = jest.spyOn(actionService, 'create');
    jest.spyOn(itemService, 'get').mockImplementation(async () => item);

    // type fix: pass individually request's params
    await app.inject({ method, url: buildUrl(item.id) });
    await new Promise((r) => setTimeout(r, CREATE_ACTION_WAIT_TIME));

    expect(mockCreateAction).toHaveBeenCalled();
    const savedAction = mockCreateAction.mock.calls[0][0];
    checkActionData(savedAction, {
      itemId: item.id,
      itemType: item.type,
      actionType: ACTION_TYPES.COPY,
    });
  });

  it('POST copy one item using copy multiple items endpoint', async () => {
    const item = getDummyItem();
    const method = 'POST';
    const ids = [item.id];
    const buildUrl = (id?) =>
      `/items/copy${qs.stringify({ id }, { arrayFormat: 'repeat', addQueryPrefix: true })}`;
    const app = await build({ method, url: buildUrl() });

    const mockCreateAction = jest.spyOn(actionService, 'create');
    jest.spyOn(itemService, 'get').mockImplementation(async () => item);

    // type fix: pass individually request's params
    await app.inject({ method, url: buildUrl(ids) });
    await new Promise((r) => setTimeout(r, CREATE_ACTION_WAIT_TIME));

    expect(mockCreateAction).toHaveBeenCalled();
    expect(mockCreateAction.mock.calls.length).toEqual(1);
    const savedAction = mockCreateAction.mock.calls[0][0];
    checkActionData(savedAction, {
      itemId: item.id,
      itemType: item.type,
      actionType: ACTION_TYPES.COPY,
    });
  });

  it('POST copy multiple items', async () => {
    const items = [getDummyItem(), getDummyItem()];
    const method = 'POST';
    const ids = items.map(({ id }) => id);
    const buildUrl = (id?) =>
      `/items/copy${qs.stringify({ id }, { arrayFormat: 'repeat', addQueryPrefix: true })}`;
    const app = await build({ method, url: buildUrl() });

    const mockCreateAction = jest.spyOn(actionService, 'create');
    jest
      .spyOn(itemService, 'get')
      .mockImplementation(async (id) => items.find(({ id: thisId }) => thisId === id));

    // type fix: pass individually request's params
    await app.inject({ method, url: buildUrl(ids) });
    await new Promise((r) => setTimeout(r, CREATE_ACTION_WAIT_TIME));

    expect(mockCreateAction).toHaveBeenCalled();
    expect(mockCreateAction.mock.calls.length).toEqual(2);
    items.forEach((item, idx) => {
      const savedAction = mockCreateAction.mock.calls[idx][0];
      checkActionData(savedAction, {
        itemId: item.id,
        itemType: item.type,
        actionType: ACTION_TYPES.COPY,
      });
    });
  });

  it('POST move item', async () => {
    const item = getDummyItem();
    const method = 'POST';
    const parentId = v4();
    const buildUrl = (id) => `/items/${id}/move`;
    const app = await build({ method, url: buildUrl(':id') });

    const mockCreateAction = jest.spyOn(actionService, 'create');
    jest.spyOn(itemService, 'get').mockImplementation(async () => item);

    // type fix: pass individually request's params
    await app.inject({
      method,
      url: buildUrl(item.id),
      payload: {
        parentId,
      },
    });
    await new Promise((r) => setTimeout(r, CREATE_ACTION_WAIT_TIME));

    expect(mockCreateAction).toHaveBeenCalled();
    const savedAction = mockCreateAction.mock.calls[0][0];
    expect(savedAction.extra.parentId).toEqual(parentId);
    checkActionData(savedAction, {
      itemId: item.id,
      itemType: item.type,
      actionType: ACTION_TYPES.MOVE,
    });
  });
  it('POST move one item using copy multiple items endpoint', async () => {
    const item = getDummyItem();
    const method = 'POST';
    const ids = [item.id];
    const buildUrl = (id?) =>
      `/items/move${qs.stringify({ id }, { arrayFormat: 'repeat', addQueryPrefix: true })}`;
    const app = await build({ method, url: buildUrl() });

    const mockCreateAction = jest.spyOn(actionService, 'create');
    jest.spyOn(itemService, 'get').mockImplementation(async () => item);

    // type fix: pass individually request's params
    await app.inject({ method, url: buildUrl(ids) });
    await new Promise((r) => setTimeout(r, CREATE_ACTION_WAIT_TIME));

    expect(mockCreateAction).toHaveBeenCalled();
    expect(mockCreateAction.mock.calls.length).toEqual(1);
    const savedAction = mockCreateAction.mock.calls[0][0];
    checkActionData(savedAction, {
      itemId: item.id,
      itemType: item.type,
      actionType: ACTION_TYPES.MOVE,
    });
  });

  it('POST move multiple items', async () => {
    const items = [getDummyItem(), getDummyItem()];
    const method = 'POST';
    const ids = items.map(({ id }) => id);
    const buildUrl = (id?) =>
      `/items/move${qs.stringify({ id }, { arrayFormat: 'repeat', addQueryPrefix: true })}`;
    const app = await build({ method, url: buildUrl() });

    const mockCreateAction = jest.spyOn(actionService, 'create');
    jest
      .spyOn(itemService, 'get')
      .mockImplementation(async (id) => items.find(({ id: thisId }) => thisId === id));

    // type fix: pass individually request's params
    await app.inject({ method, url: buildUrl(ids) });
    await new Promise((r) => setTimeout(r, CREATE_ACTION_WAIT_TIME));

    expect(mockCreateAction).toHaveBeenCalled();
    expect(mockCreateAction.mock.calls.length).toEqual(2);
    items.forEach((item, idx) => {
      const savedAction = mockCreateAction.mock.calls[idx][0];
      checkActionData(savedAction, {
        itemId: item.id,
        itemType: item.type,
        actionType: ACTION_TYPES.MOVE,
      });
    });
  });

  it('PATCH item', async () => {
    const item = getDummyItem();
    const method = 'PATCH';
    const buildUrl = (id?) => `/items/${id}`;
    const app = await build({ method, url: buildUrl(':id') });

    const mockCreateAction = jest.spyOn(actionService, 'create');
    jest.spyOn(itemService, 'get').mockImplementation(async () => item);

    // type fix: pass individually request's params
    await app.inject({ method, url: buildUrl(item.id) });
    await new Promise((r) => setTimeout(r, CREATE_ACTION_WAIT_TIME));

    expect(mockCreateAction).toHaveBeenCalled();
    const savedAction = mockCreateAction.mock.calls[0][0];
    checkActionData(savedAction, {
      itemId: item.id,
      itemType: item.type,
      actionType: ACTION_TYPES.UPDATE,
    });
  });
  it('PATCH multiple items', async () => {
    const items = [getDummyItem(), getDummyItem()];
    const method = 'PATCH';
    const ids = items.map(({ id }) => id);
    const buildUrl = (id?) =>
      `/items${qs.stringify({ id }, { arrayFormat: 'repeat', addQueryPrefix: true })}`;
    const app = await build({ method, url: buildUrl() });

    const mockCreateAction = jest.spyOn(actionService, 'create');
    jest
      .spyOn(itemService, 'get')
      .mockImplementation(async (id) => items.find(({ id: thisId }) => thisId === id));

    // type fix: pass individually request's params
    await app.inject({ method, url: buildUrl(ids) });
    await new Promise((r) => setTimeout(r, CREATE_ACTION_WAIT_TIME));

    expect(mockCreateAction).toHaveBeenCalled();
    expect(mockCreateAction.mock.calls.length).toEqual(2);
    items.forEach((item, idx) => {
      const savedAction = mockCreateAction.mock.calls[idx][0];
      checkActionData(savedAction, {
        itemId: item.id,
        itemType: item.type,
        actionType: ACTION_TYPES.UPDATE,
      });
    });
  });
});

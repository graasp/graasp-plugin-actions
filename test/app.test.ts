import { StatusCodes } from 'http-status-codes';
import { v4 } from 'uuid';

import { FastifyLoggerInstance } from 'fastify';

import {
  FileItemType,
  ItemMembership,
  ItemType,
  LocalFileConfiguration,
  MemberTaskManager,
  S3FileConfiguration,
} from '@graasp/sdk';
import { ItemMembershipTaskManager, ItemTaskManager, TaskRunner, buildItem } from 'graasp-test';

import { ActionService } from '../src';
import { ACTION_TYPES, VIEW_BUILDER_NAME } from '../src/constants/constants';
import build from './app';
import { CLIENT_HOSTS, GRAASP_ACTOR, createDummyAction } from './constants';
import {
  mockCheckRequestExport,
  mockCreateArchiveTask,
  mockCreateGetManyTask,
  mockCreateGetMemberItemMembershipTask,
  mockCreateGetOfItemTaskSequence,
  mockGetDescendantsTask,
  mockGetTask,
  mockRunSingleSequence,
  mockSendMail,
} from './mocks';
import { checkActionData } from './utils';

const itemTaskManager = new ItemTaskManager();
const memberTaskManager = {} as unknown as MemberTaskManager;
const itemMembershipTaskManager = new ItemMembershipTaskManager();
const runner = new TaskRunner();
const actor = GRAASP_ACTOR;
const MOCK_LOGGER = {} as unknown as FastifyLoggerInstance;

const DEFAULT_OPTIONS = {
  shouldSave: true,
  graaspActor: GRAASP_ACTOR,
  hosts: CLIENT_HOSTS,
  fileItemType: ItemType.S3_FILE as FileItemType,
  fileConfigurations: {
    s3: {} as unknown as S3FileConfiguration,
    local: {} as unknown as LocalFileConfiguration,
  },
};

describe('Plugin Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Hooks', () => {
    const item = buildItem();

    describe('Create Post Hook Handler', () => {
      it('create action when creating an item', async () => {
        jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(async () => false);
        jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(async (name, fn) => {
          if (name === itemTaskManager.getCreateTaskName()) {
            const mockCreateAction = jest
              .spyOn(ActionService.prototype, 'create')
              .mockImplementation(async (action) => action);
            await fn(item, actor, { log: MOCK_LOGGER });

            const savedAction = mockCreateAction.mock.calls[0][0];
            expect(mockCreateAction).toHaveBeenCalled();
            checkActionData(savedAction, {
              itemId: item.id,
              itemPath: item.path,
              itemType: item.type,
              actionType: ACTION_TYPES.CREATE,
              view: VIEW_BUILDER_NAME,
            });
          }
        });

        await build({
          itemTaskManager,
          runner,
          itemMembershipTaskManager,
          memberTaskManager,
          options: DEFAULT_OPTIONS,
        });
      });
    });

    describe('Delete Post Hook Handler', () => {
      it('create action when deleting an item', async () => {
        jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(async () => false);
        jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(async (name, fn) => {
          if (name === itemTaskManager.getDeleteTaskName()) {
            const mockCreateAction = jest
              .spyOn(ActionService.prototype, 'create')
              .mockImplementation(async (action) => action);
            await fn(item, actor, { log: MOCK_LOGGER });

            const savedAction = mockCreateAction.mock.calls[0][0];
            expect(mockCreateAction).toHaveBeenCalled();
            checkActionData(savedAction, {
              itemPath: null,
              itemId: null,
              extraItemId: item.id,
              itemType: item.type,
              actionType: ACTION_TYPES.DELETE,
              view: VIEW_BUILDER_NAME,
            });
          }
        });

        await build({
          itemTaskManager,
          runner,
          itemMembershipTaskManager,
          memberTaskManager,
          options: DEFAULT_OPTIONS,
        });
      });
    });
  });

  describe('Actions', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(async () => false);
      jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(async () => false);
    });

    describe('GET /items/:id', () => {
      it('Successfully get actions from item id', async () => {
        const items = [buildItem()];
        const item = items[0];
        const itemMemberships = [{}] as unknown as ItemMembership[];
        const actions = [createDummyAction()];
        const members = [{ name: 'member' }];
        const metadata = {
          numActionsRetrieved: 5,
          requestedSampleSize: 5,
        };
        mockGetTask(item);
        mockCreateGetMemberItemMembershipTask(item);
        mockCreateGetOfItemTaskSequence(itemMemberships);
        mockCreateGetManyTask([GRAASP_ACTOR], memberTaskManager);
        mockGetDescendantsTask(items);

        const result = {
          descendants: items,
          item,
          actions,
          members,
          itemMemberships,
          metadata,
        };
        mockRunSingleSequence(result);

        const app = await build({
          itemTaskManager,
          runner,
          itemMembershipTaskManager,
          memberTaskManager,
          options: DEFAULT_OPTIONS,
        });

        const itemId = v4();
        const res = await app.inject({
          method: 'GET',
          url: `/items/${itemId}`,
        });

        expect(res.statusCode).toBe(StatusCodes.OK);
        expect(res.payload).toBeTruthy();
        expect(res.json().actions).toEqual(actions);
        expect(res.json().item).toEqual(items[0]);
        expect(res.json().descendants).toEqual(items);
        expect(res.json().members).toEqual(members);
        expect(res.json().itemMemberships).toEqual(itemMemberships);
        expect(res.json().metadata).toEqual(metadata);
      });

      it('Successfully get actions from item id with view and sample size', async () => {
        const items = [buildItem()];
        const item = items[0];
        const itemMemberships = [{}] as unknown as ItemMembership[];
        const actions = [createDummyAction()];
        const members = [{ name: 'member' }];
        const metadata = {
          numActionsRetrieved: 5,
          requestedSampleSize: 5,
        };
        mockGetTask(item);
        mockCreateGetMemberItemMembershipTask(item);
        mockCreateGetOfItemTaskSequence(itemMemberships);
        mockCreateGetManyTask([GRAASP_ACTOR], memberTaskManager);
        mockGetDescendantsTask(items);

        const result = {
          descendants: items,
          item,
          actions,
          members,
          itemMemberships,
          metadata,
        };
        mockRunSingleSequence(result);

        const app = await build({
          itemTaskManager,
          runner,
          itemMembershipTaskManager,
          memberTaskManager,
          options: DEFAULT_OPTIONS,
        });

        const itemId = v4();
        const res = await app.inject({
          method: 'GET',
          url: `/items/${itemId}?view=builder&requestedSampleSize=1`,
        });

        expect(res.statusCode).toBe(StatusCodes.OK);
        expect(res.payload).toBeTruthy();
        expect(res.json().actions).toEqual(actions);
        expect(res.json().item).toEqual(items[0]);
        expect(res.json().descendants).toEqual(items);
        expect(res.json().members).toEqual(members);
        expect(res.json().itemMemberships).toEqual(itemMemberships);
        expect(res.json().metadata).toEqual(metadata);
      });

      it('Successfully get actions from item id with view and sample size', async () => {
        const items = [buildItem()];
        const item = items[0];
        const itemMemberships = [{}] as unknown as ItemMembership[];
        const actions = [createDummyAction()];
        const members = [{ name: 'member' }];
        const metadata = {
          numActionsRetrieved: 5,
          requestedSampleSize: 5,
        };
        mockGetTask(item);
        mockCreateGetMemberItemMembershipTask(item);
        mockCreateGetOfItemTaskSequence(itemMemberships);
        mockCreateGetManyTask([GRAASP_ACTOR], memberTaskManager);
        mockGetDescendantsTask(items);

        const result = {
          descendants: items,
          item,
          actions,
          members,
          itemMemberships,
          metadata,
        };
        mockRunSingleSequence(result);

        const app = await build({
          itemTaskManager,
          runner,
          itemMembershipTaskManager,
          memberTaskManager,
          options: DEFAULT_OPTIONS,
        });

        const itemId = v4();
        const res = await app.inject({
          method: 'GET',
          url: `/items/${itemId}?view=builder&requestedSampleSize=1`,
        });

        expect(res.statusCode).toBe(StatusCodes.OK);
        expect(res.payload).toBeTruthy();
        expect(res.json().actions).toEqual(actions);
        expect(res.json().item).toEqual(items[0]);
        expect(res.json().descendants).toEqual(items);
        expect(res.json().members).toEqual(members);
        expect(res.json().itemMemberships).toEqual(itemMemberships);
        expect(res.json().metadata).toEqual(metadata);
      });

      it('Throw if item id is invalid', async () => {
        const app = await build({
          itemTaskManager,
          runner,
          itemMembershipTaskManager,
          memberTaskManager,
          options: DEFAULT_OPTIONS,
        });

        const res = await app.inject({
          method: 'GET',
          url: '/items/invalid-id',
        });

        expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST);
      });
    });
  });

  describe('Export Actions', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(async () => false);
      jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(async () => false);
    });

    it('Request export actions successfully', async () => {
      mockCheckRequestExport({ itemTaskManager, itemMembershipTaskManager });
      mockSendMail(runner);

      jest.spyOn(runner, 'runSingleSequence').mockImplementation(async (tasks) => {
        // check if request in interval exists
        if (tasks.length === 3) {
          return null;
        }
        // run correctly for the other tasks
        return tasks[0].result;
      });

      const createArchiveMock = mockCreateArchiveTask();
      const sendExportActionsEmail = jest.fn().mockImplementation(async () => true);

      const app = await build({
        itemTaskManager,
        runner,
        itemMembershipTaskManager,
        memberTaskManager,
        options: DEFAULT_OPTIONS,
        sendExportActionsEmail,
      });

      const itemId = v4();
      const res = await app.inject({
        method: 'POST',
        url: `/items/${itemId}/export`,
      });

      expect(createArchiveMock).toHaveBeenCalled();
      expect(res.statusCode).toBe(StatusCodes.NO_CONTENT);
      expect(res.payload).toBeFalsy();
    });

    it('If previous request export exists, return the same file', async () => {
      mockCheckRequestExport({ itemTaskManager, itemMembershipTaskManager });
      mockSendMail(runner);
      jest
        .spyOn(runner, 'runSingleSequence')
        .mockImplementation(async () => ({ createdAt: new Date() }));

      const createArchiveMock = mockCreateArchiveTask();
      const sendExportActionsEmail = jest.fn().mockImplementation(async () => true);

      const app = await build({
        itemTaskManager,
        runner,
        itemMembershipTaskManager,
        memberTaskManager,
        options: DEFAULT_OPTIONS,
        sendExportActionsEmail,
      });

      const itemId = v4();
      const res = await app.inject({
        method: 'POST',
        url: `/items/${itemId}/export`,
      });

      expect(sendExportActionsEmail).toHaveBeenCalled();
      expect(createArchiveMock).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(StatusCodes.NO_CONTENT);
      expect(res.payload).toBeFalsy();
    });

    it('Invalid item id throws', async () => {
      const itemId = 'invalid';

      const app = await build({
        itemTaskManager,
        runner,
        itemMembershipTaskManager,
        memberTaskManager,
        options: DEFAULT_OPTIONS,
      });

      const res = await app.inject({
        method: 'POST',
        url: `/items/${itemId}/export`,
      });

      expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST);
    });
  });
});

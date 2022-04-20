import { ItemTaskManager, ItemMembershipTaskManager, TaskRunner } from 'graasp-test';
import { CLIENT_HOSTS, createDummyAction, GRAASP_ACTOR } from './constants';
import build from './app';
import { ActionService, ActionTaskManager } from '../src';
import * as utils from '../src/utils/export';
import { checkActionData, getDummyItem } from './utils';
import { ACTION_TYPES, VIEW_BUILDER_NAME } from '../src/constants/constants';
import { Item, MemberTaskManager } from 'graasp';
import { StatusCodes } from 'http-status-codes';
import { v4 } from 'uuid';
import {
  FileTaskManager,
  GraaspLocalFileItemOptions,
  GraaspS3FileItemOptions,
  ServiceMethod,
} from 'graasp-plugin-file';
import MockTask from 'graasp-test/src/tasks/task';
import { BaseAnalytics } from '../src/services/action/base-analytics';
import { EmptyActionError } from '../src/utils/errors';

const itemTaskManager = new ItemTaskManager();
const memberTaskManager = {} as unknown as MemberTaskManager;
const itemMembershipTaskManager = new ItemMembershipTaskManager();
const runner = new TaskRunner();
const actor = GRAASP_ACTOR;

const DEFAULT_OPTIONS = {
  shouldSave: true,
  graaspActor: GRAASP_ACTOR,
  hosts: CLIENT_HOSTS,
  serviceMethod: ServiceMethod.S3,
  serviceOptions: {
    s3: {} as unknown as GraaspS3FileItemOptions,
    local: {} as unknown as GraaspLocalFileItemOptions,
  },
};

describe('Plugin Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Hooks', () => {
    const item = getDummyItem();

    describe('Create Post Hook Handler', () => {
      it('create action when creating an item', async () => {
        jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(async () => false);
        jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(async (name, fn) => {
          if (name === itemTaskManager.getCreateTaskName()) {
            const mockCreateAction = jest
              .spyOn(ActionService.prototype, 'create')
              .mockImplementation(async (action) => action);
            await fn(item, actor, { log: undefined });

            const savedAction = mockCreateAction.mock.calls[0][0];
            expect(mockCreateAction).toHaveBeenCalled();
            checkActionData(savedAction, {
              itemId: item.id,
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
            await fn(item, actor, { log: undefined });

            const savedAction = mockCreateAction.mock.calls[0][0];
            expect(mockCreateAction).toHaveBeenCalled();
            checkActionData(savedAction, {
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

  describe('Export Actions', () => {
    beforeEach(() => {
      jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(async () => false);
      jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(async () => false);
    });

    it('Request export actions successfully', async () => {
      const itemId = v4();

      const createArchiveMock = jest
        .spyOn(utils, 'createActionArchive')
        .mockImplementation(async () => {
          // do nothing
        });

      const baseAnalytics = new BaseAnalytics({
        actions: [createDummyAction()],
        item: { id: itemId } as unknown as Item,
        itemMemberships: [],
        members: [],
        metadata: {
          requestedSampleSize: 5,
          numActionsRetrieved: 5
        }
      });
      jest.spyOn(ActionTaskManager.prototype, 'createGetBaseAnalyticsForItemTaskSequence').mockImplementation(() => [])
      jest.spyOn(runner, 'runSingleSequence').mockImplementation(async () => baseAnalytics);
      jest.spyOn(runner, 'runSingle').mockImplementation(async () => new MockTask(true));
      jest
        .spyOn(FileTaskManager.prototype, 'createDownloadFileTask')
        .mockImplementation(() => new MockTask(''));

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

      expect(createArchiveMock).toHaveBeenCalled();
      expect(res.statusCode).toBe(StatusCodes.NO_CONTENT);
      expect(res.payload).toBeFalsy();
    });

    it('Empty action for item should throw', async () => {
      const itemId = v4();

      const createArchiveMock = jest
        .spyOn(utils, 'createActionArchive')
        .mockImplementation(async () => {
          // do nothing
        });

      const baseAnalytics = new BaseAnalytics({
        actions: [],
        item: { id: itemId } as unknown as Item,
        members: [], itemMemberships: [],
        metadata: {
          requestedSampleSize: 5,
          numActionsRetrieved: 0
        }
      });
      jest.spyOn(ActionTaskManager.prototype, 'createGetBaseAnalyticsForItemTaskSequence').mockImplementation(() => [])
      jest.spyOn(runner, 'runSingleSequence').mockImplementation(async () => baseAnalytics);
      jest.spyOn(runner, 'runSingle').mockImplementation(async () => new MockTask(true));
      jest
        .spyOn(FileTaskManager.prototype, 'createDownloadFileTask')
        .mockImplementation(() => new MockTask(''));

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

      expect(await res.json()).toEqual(new EmptyActionError(itemId));
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

import { ItemTaskManager, ItemMembershipTaskManager, TaskRunner } from 'graasp-test';
import { GRAASP_ACTOR } from './constants';
import build from './app';
import { ActionService } from '../src';
import { checkActionData, getDummyItem } from './utils';
import { ACTION_TYPES, VIEW_BUILDER_NAME } from '../src/constants/constants';
import { MemberTaskManager } from 'graasp';
import { CLIENT_HOSTS } from '../src/constants/constants';

const itemTaskManager = new ItemTaskManager();
const memberTaskManager = {} as unknown as MemberTaskManager;
const itemMembershipTaskManager = new ItemMembershipTaskManager();
const runner = new TaskRunner();
const actor = GRAASP_ACTOR;

const DEFAULT_OPTIONS = {
  shouldSave: true,
  graaspActor: GRAASP_ACTOR,
  hosts: CLIENT_HOSTS,
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
});

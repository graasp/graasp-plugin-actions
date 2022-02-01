import { Item } from 'graasp';
import {
  Task as MockTask,
  TaskRunner as MockTaskRunner,
  ItemTaskManager as MockItemTaskManager,
  ItemMembershipTaskManager as MockItemMembershipTaskManager,
} from 'graasp-test';

// using multiple mocks updates runSingleSequence multiple times

export const mockGetTaskSequence = (
  data: Partial<Item> | Error,
  shouldThrow?: boolean,
): jest.SpyInstance => {
  const mockCreateTask = jest
    .spyOn(MockItemTaskManager.prototype, 'createGetTaskSequence')
    .mockImplementation(() => {
      return [new MockTask(data)];
    });
  jest.spyOn(MockTaskRunner.prototype, 'runSingleSequence').mockImplementation(async () => {
    if (shouldThrow) throw data;
    return data;
  });
  return mockCreateTask;
};

export const mockDeleteTask = (
  data: Partial<Item> | Error,
  shouldThrow?: boolean,
): jest.SpyInstance => {
  const mockTask = jest
    .spyOn(MockItemTaskManager.prototype, 'createDeleteTask')
    .mockImplementation(() => {
      return new MockTask(data);
    });
  jest.spyOn(MockTaskRunner.prototype, 'runSingleSequence').mockImplementation(async () => {
    if (shouldThrow) throw data;
    return data;
  });
  return mockTask;
};

// item memberships

export const mockCreateGetMemberItemMembershipTask = (
  data: Partial<Item> | Error,
  shouldThrow?: boolean,
): jest.SpyInstance => {
  const mockTask = jest
    .spyOn(MockItemMembershipTaskManager.prototype, 'createGetMemberItemMembershipTask')
    .mockImplementation(() => {
      return new MockTask(data);
    });
  jest.spyOn(MockTaskRunner.prototype, 'runSingle').mockImplementation(async () => {
    if (shouldThrow) throw data;
    return data;
  });
  return mockTask;
};

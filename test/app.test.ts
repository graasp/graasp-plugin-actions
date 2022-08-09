import { TaskRunner } from 'graasp-test';

import { buildApp } from './app';
import { CLIENT_HOSTS } from './constants';

const runner = new TaskRunner();

const DEFAULT_OPTIONS = {
  hosts: CLIENT_HOSTS,
};

describe('Plugin Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Item Actions', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(async () => false);
      jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(async () => false);
    });

    it('decorate actions', async () => {
      const app = await buildApp({ runner, options: DEFAULT_OPTIONS });

      expect(app.actions?.dbService).toBeTruthy();
      expect(app.actions?.taskManager).toBeTruthy();
    });
  });
});

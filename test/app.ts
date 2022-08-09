import fastify from 'fastify';

import {
  ActionService,
  Item,
  ItemMembershipTaskManager,
  MemberTaskManager,
  TaskRunner,
} from '@graasp/sdk';
import { ItemTaskManager } from 'graasp-test';

import itemPlugin, { GraaspItemActionsOptions } from '../src/itemPlugin';
import memberPlugin, { GraaspMemberActionsOptions } from '../src/memberPlugin';
import plugin, { GraaspActionsOptions } from '../src/plugin';
import { exportActionsInArchive } from '../src/utils/export';
import { GRAASP_ACTOR } from './constants';

const schemas = {
  $id: 'http://graasp.org/',
  definitions: {
    uuid: {
      type: 'string',
      pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
    },
    idParam: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { $ref: '#/definitions/uuid' },
      },
      additionalProperties: false,
    },
  },
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const buildAppWithItemActions = async ({
  runner,
  itemTaskManager,
  itemMembershipTaskManager,
  memberTaskManager,
  actionService,
  options,
  sendExportActionsEmail,
}: {
  runner: TaskRunner<Item>;
  itemTaskManager: ItemTaskManager;
  itemMembershipTaskManager: ItemMembershipTaskManager;
  memberTaskManager: MemberTaskManager;
  actionService: ActionService;
  options?: GraaspItemActionsOptions;
  sendExportActionsEmail?: typeof exportActionsInArchive;
}) => {
  const app = fastify();
  app.addSchema(schemas);
  app.decorateRequest('member', GRAASP_ACTOR);

  app.decorate('taskRunner', runner);
  app.decorate('items', {
    taskManager: itemTaskManager,
  });
  app.decorate('itemMemberships', {
    taskManager: itemMembershipTaskManager,
  });
  app.decorate('members', {
    taskManager: memberTaskManager,
  });
  app.decorate('mailer', {
    sendExportActionsEmail: sendExportActionsEmail ?? jest.fn(),
  });

  app.decorate('actions', {
    dbService: actionService,
  });

  await app.register(itemPlugin, options);

  return app;
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const buildAppWithMemberActions = async ({
  runner,
  memberTaskManager,
  actionService,
  options,
  sendExportActionsEmail,
}: {
  runner: TaskRunner<Item>;
  memberTaskManager: MemberTaskManager;
  actionService: ActionService;
  options?: GraaspMemberActionsOptions;
  sendExportActionsEmail?: typeof exportActionsInArchive;
}) => {
  const app = fastify();
  app.addSchema(schemas);
  app.decorateRequest('member', GRAASP_ACTOR);

  app.decorate('taskRunner', runner);

  app.decorate('members', {
    taskManager: memberTaskManager,
  });
  app.decorate('mailer', {
    sendExportActionsEmail: sendExportActionsEmail ?? jest.fn(),
  });

  app.decorate('actions', {
    dbService: actionService,
  });

  await app.register(memberPlugin, options);

  return app;
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const buildApp = async ({
  runner,
  options,
}: {
  runner: TaskRunner<Item>;
  options?: GraaspActionsOptions;
}) => {
  const app = fastify();
  app.addSchema(schemas);

  app.decorate('taskRunner', runner);

  await app.register(plugin, options);

  return app;
};

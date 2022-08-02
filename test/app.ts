import fastify from 'fastify';

import { Item, ItemMembershipTaskManager, MemberTaskManager, TaskRunner } from '@graasp/sdk';
import { ItemTaskManager } from 'graasp-test';

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
const build = async ({
  runner,
  itemTaskManager,
  itemMembershipTaskManager,
  memberTaskManager,
  options,
  sendExportActionsEmail,
}: {
  runner: TaskRunner<Item>;
  itemTaskManager: ItemTaskManager;
  itemMembershipTaskManager: ItemMembershipTaskManager;
  memberTaskManager: MemberTaskManager;
  options?: GraaspActionsOptions;
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

  await app.register(plugin, options);

  return app;
};
export default build;

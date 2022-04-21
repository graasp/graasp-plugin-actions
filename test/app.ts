import fastify from 'fastify';
import { Item, ItemMembershipTaskManager, MemberTaskManager, TaskRunner } from 'graasp';
import { ItemTaskManager } from 'graasp-test';
import plugin, { GraaspActionsOptions } from '../src/plugin';
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

const build = async ({
  runner,
  itemTaskManager,
  itemMembershipTaskManager,
  memberTaskManager,
  options,
  sendActionExportEmail,
}: {
  runner: TaskRunner<Item>;
  itemTaskManager: ItemTaskManager;
  itemMembershipTaskManager: ItemMembershipTaskManager;
  memberTaskManager: MemberTaskManager;
  options?: GraaspActionsOptions;
  // eslint-disable-next-line @typescript-eslint/ban-types
  sendActionExportEmail?: Function;
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
    sendActionExportEmail: sendActionExportEmail ?? jest.fn(),
  });

  await app.register(plugin, options);

  return app;
};
export default build;

import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

import { Hostname } from '@graasp/sdk';

import { ActionService } from './services/action/db-service';
import { ActionTaskManager } from './services/action/task-manager';

export interface GraaspActionsOptions {
  hosts: Hostname[];
}

const plugin: FastifyPluginAsync<GraaspActionsOptions> = async (fastify, options) => {
  const { hosts } = options;

  const actionService = new ActionService();
  const actionTaskManager = new ActionTaskManager(actionService, hosts);

  fastify.decorate('actions', {
    taskManager: actionTaskManager,
    dbService: actionService,
  });
};

export default fp(plugin, {
  fastify: '3.x',
  name: 'graasp-plugin-actions',
});

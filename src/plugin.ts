import { FastifyPluginAsync } from 'fastify';

import {
  Actor,
  FileItemType,
  Hostname,
  LocalFileConfiguration,
  S3FileConfiguration,
} from '@graasp/sdk';

import { ActionService } from './services/action/db-service';
import { ActionTaskManager } from './services/action/task-manager';

export interface GraaspActionsOptions {
  graaspActor: Actor;
  shouldSave?: boolean;
  hosts: Hostname[];
  fileItemType: FileItemType;
  fileConfigurations: { s3: S3FileConfiguration; local: LocalFileConfiguration };
}

const plugin: FastifyPluginAsync<GraaspActionsOptions> = async (fastify, options) => {
  const { hosts } = options;

  const actionService = new ActionService();
  const actionTaskManager = new ActionTaskManager(actionService, hosts);

  fastify.decorate('action', {
    taskManager: actionTaskManager,
    dbService: actionService,
  });
};

export default plugin;

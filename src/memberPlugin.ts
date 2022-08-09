import { FastifyPluginAsync } from 'fastify';

import {
  Actor,
  FileItemType,
  Hostname,
  IdParam,
  LocalFileConfiguration,
  S3FileConfiguration,
} from '@graasp/sdk';

import { deleteAllById } from './schemas/schemas';
import MemberActionTaskManager from './services/action/member-task-manager';

export interface GraaspActionsOptions {
  graaspActor: Actor;
  shouldSave?: boolean;
  hosts: Hostname[];
  fileItemType: FileItemType;
  fileConfigurations: { s3: S3FileConfiguration; local: LocalFileConfiguration };
}

const plugin: FastifyPluginAsync<GraaspActionsOptions> = async (fastify) => {
  const {
    taskRunner: runner,
    action: { dbService: actionService },
  } = fastify;

  const memberActionTaskManager = new MemberActionTaskManager(actionService);

  // todo: delete self data
  // delete all the actions matching the given `memberId`
  fastify.delete<{ Params: IdParam }>(
    '/members/:id/delete',
    { schema: deleteAllById },
    async ({ member, params: { id } }) => {
      const task = memberActionTaskManager.createDeleteTask(member, id);
      return runner.runSingle(task);
    },
  );
};

export default plugin;

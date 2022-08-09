import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

import { IdParam } from '@graasp/sdk';

import { deleteAllById } from './schemas/schemas';
import MemberActionTaskManager from './services/action/member-task-manager';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GraaspMemberActionsOptions {}

const plugin: FastifyPluginAsync<GraaspMemberActionsOptions> = async (fastify) => {
  const {
    taskRunner: runner,
    actions: { dbService: actionService },
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

export default fp(plugin, {
  fastify: '3.x',
  name: 'graasp-plugin-actions-members',
});

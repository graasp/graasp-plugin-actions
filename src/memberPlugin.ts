import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

import { IdParam } from '@graasp/sdk';

import { deleteAllById, enableActions } from './schemas/schemas';
import { MemberActionService } from './services/action/member/member-db-service';
import MemberActionTaskManager from './services/action/member/member-task-manager';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GraaspMemberActionsOptions {}

const plugin: FastifyPluginAsync<GraaspMemberActionsOptions> = async (fastify) => {
  const {
    taskRunner: runner,
    members: { taskManager: memberTaskManager },
  } = fastify;

  const memberActionService = new MemberActionService();
  const memberActionTaskManager = new MemberActionTaskManager(
    memberActionService,
    memberTaskManager,
  );

  // delete all own actions
  fastify.delete<{ Params: IdParam }>(
    '/analytics/delete',
    { schema: deleteAllById },
    async ({ member, params: { id } }) => {
      const task = memberActionTaskManager.createDeleteTask(member, id);
      return runner.runSingle(task);
    },
  );

  // toggle enable actions setting
  fastify.patch<{ Params: IdParam; Body: boolean }>(
    '/analytics/enable',
    { schema: enableActions },
    async ({ member, body: enableActions }) => {
      const tasks = memberActionTaskManager.createSetEnableActionsTaskSequence(
        member,
        enableActions,
      );
      return runner.runSingleSequence(tasks);
    },
  );
};

export default fp(plugin, {
  fastify: '3.x',
  name: 'graasp-plugin-actions-members',
});

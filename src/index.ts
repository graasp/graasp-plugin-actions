import geoip from "geoip-lite";

// global
import { FastifyPluginAsync } from "fastify";
import { Item, Member, IdParam, Actor } from "graasp";

// local
import { CreateActionTask } from './services/action/create-action-task';
import { GetActionsTask } from './services/action/get-actions-task';
import { DeleteActionsTask } from './services/action/delete-actions-task';
import { GetMembershipTask } from './services/item-membership/get-membership-task';
import { GetMembersTask } from './services/member/get-member-task';
import { GetItemTask } from './services/item/get-item-task';
import { BaseAction } from './services/action/base-action';
import { ActionService } from './db-service';
import { Action } from "./interfaces/action";
import { paths } from './constants/constants';
import { correctStatusCodes } from './constants/constants';

import {
  getOne
} from './schemas/schemas';
import { BaseAnalytics } from "./services/action/base-analytics";
import { Analytics, AnalyticsQueryParams } from "./interfaces/analytics";


export interface GraaspActionsOptions {
  graaspActor: Actor;
}

const actionService = new ActionService();

const plugin: FastifyPluginAsync<GraaspActionsOptions> = async (fastify, options) => {
  const { graaspActor } = options;
  const {
    items: { taskManager, dbService: iS },
    members: {dbService: memberService},
    itemMemberships: {dbService: itemMembershipsService},
    taskRunner: runner,
    log: defaultLogger,
  } = fastify;

  // save action when a item is created
  const createItemTaskName = taskManager.getCreateTaskName();
  runner.setTaskPostHookHandler(createItemTaskName, async (item: Partial<Item>, actor, { log, handler }) => {
    const member = actor as Member;
    const extra = {memberId: actor.id, itemId: item.id};
    const view = 'builder';
    const geo = null;
    const action: Action = new BaseAction(actor.id, item.id, member.type, item.type, "create", view, geo, extra);
    actionService.create(action, handler);
  });
 
  // get all the actions matching the given `id`
  fastify.get<{ Querystring: AnalyticsQueryParams }>(
    '/research/analytics',
    { schema: getOne },
    async ({ member, query: { itemId, requestedSampleSize, view }, log }, reply) => {

      const t1 = new GetActionsTask(member, itemId, requestedSampleSize, view, actionService);
      await runner.runSingle(t1);
      const actions = t1.result;

      const t2 = new GetItemTask(member, itemId, iS);
      await runner.runSingle(t2);
      const item = t2.result;

      const t3 = new GetMembershipTask(member, item, itemMembershipsService);
      await runner.runSingle(t3);
      const memberships = t3.result;

      const t4 = new GetMembersTask(member, memberships, memberService);
      await runner.runSingle(t4);
      const members = t4.result;

      const numActionsRetrieved = actions.length;
      const metadata = {
        numActionsRetrieved: numActionsRetrieved,
        requestedSampleSize: parseInt(requestedSampleSize)
      }

      const responseData: Analytics = new BaseAnalytics(actions, members, item, metadata);
      
      reply
      .code(200)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send( responseData )
    },
  );
  
  // delete all the actions matching the given `memberId`
  fastify.delete<{ Params: IdParam }>(
    '/members/:id/delete-actions',
    { schema: getOne },
    async ({ member, params: { id }, log,  }, reply) => {
      const task = new DeleteActionsTask(member, id, actionService);
      await runner.runSingle(task);

      reply
      .code(200)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send( task.result )      
    },
  );

};


// save action (except create and delete) for the itemId with its actionType and view
const createActionTask = async function (member: Member, itemId: string, actionType: string, view: string, geo, runner, itemService) {
  // get item
  const t1 = new GetItemTask(member, itemId, itemService);
  await runner.runSingle(t1);
  const item = t1.result;
  // save action
  const extra = {memberId: member.id, itemId: item.id};
  let action: Action = new BaseAction(member.id, item.id, member.type, item.type, actionType, view, geo, extra);
  const t2 = new CreateActionTask(member, action, actionService);
  runner.runSingle(t2);
};

// save delete item action for the itemId with corresponding view
const createDeleteActionTask = async function (member: Member, itemId: string, actionType: string, view: string, geo, runner, itemService) {
  // save action
  const extra = {memberId: member.id, itemId: itemId};
  let action: Action = new BaseAction(member.id, null, member.type, null, actionType, view, geo, extra);
  const t2 = new CreateActionTask(member, action, actionService);
  runner.runSingle(t2);
};

// save action (except create and delete) for each itemId with corresponding actionType and view
const createActionTaskMultipleItems = async function (member: Member, itemIds: [string], actionType: string, view: string, geo, runner, itemService) {
  // get item and save action for each item
  for (const itemId in itemIds) {
    const t1 = new GetItemTask(member, itemIds[itemId], itemService);
    await runner.runSingle(t1);
    const item = t1.result;
    const extra = {memberId: member.id, itemId: item.id};
    let action: Action = new BaseAction(member.id, item.id, member.type, item.type, actionType, view, geo, extra);
    const t2 = new CreateActionTask(member, action, actionService);
    await runner.runSingle(t2);
  }
};

// save delete item action for each itemId with corresponding view
const createDeleteActionTaskMultipleItems = async function (member: Member, itemIds: [string], actionType: string, view: string, geo, runner, itemService) {
  // save action for each item
  for (const itemId in itemIds) {
    const extra = {memberId: member.id, itemId: itemIds[itemId]};
    let action: Action = new BaseAction(member.id, null, member.type, null, actionType, view, geo, extra);
    const t2 = new CreateActionTask(member, action, actionService);
    await runner.runSingle(t2);
  }
};

// function called each time there is a request in the items in graasp (onResponse hook in graasp)
// identify and check the correct endpoint of the request
export const createAction = async function (request, reply, runner, itemService) {
  // check that the request is ok
  if (correctStatusCodes.includes(reply.statusCode)) {
    const url: string = request.url;
    const method: string = request.method;
    const member: Member = request.member;
    const paramItemId: string = request.params.id;
    const queryItemsId: [string] = request.query.id;
    const geo = geoip.lookup(/*request.ip*/'192.33.202.80');

    var view = null;
    const hostname = request.hostname;
    if (hostname == 'builder.graasp.org') {
      view = 'builder';
    } else if (hostname == 'player.graasp.org') {
      view = 'player';
    } else if (hostname == 'research.graasp.org') {
      view = 'research';
    } else if (hostname == 'localhost:3000') {
      view = 'localhost';
    }

    // identify the endpoint with method and url
    // call createActionTask or createActionTaskMultipleItems to save the corresponding action
    if (method == 'GET') {
      switch(true) {
        case paths.downloadItem.test(url):
          createActionTask(member, paramItemId, "download", view, geo, runner, itemService);
          break;
        case paths.childrenItem.test(url):
          createActionTask(member, paramItemId, "get-children", view, geo, runner, itemService);
          break;
        case paths.baseItem.test(url):
          createActionTask(member, paramItemId, "get", view, geo, runner, itemService);
          break;
      }
    } else if (method == 'POST') {
      switch(true) {
        case paths.copyItem.test(url):
          createActionTask(member, paramItemId, "copy", view, geo, runner, itemService);
          break;
        case paths.moveItem.test(url):
          createActionTask(member, paramItemId, "move", view, geo, runner, itemService);
          break;
      }
    } else if (method == 'DELETE') {
      switch(true) {
        case paths.baseItem.test(url):
          createDeleteActionTask(member, paramItemId, "delete", view, geo, runner, itemService);
          break;
        case paths.multipleItems.test(url):
          createDeleteActionTaskMultipleItems(member, queryItemsId, "delete", view, geo, runner, itemService);
          break;
      }
    } else if (method == 'PATCH') {
      switch(true) {
        case paths.baseItem.test(url):
          createActionTask(member, paramItemId, "modify", view, geo, runner, itemService);
          break;
        case paths.multipleItems.test(url):
          createActionTaskMultipleItems(member, queryItemsId, "modify", view, geo, runner, itemService);
          break;
      }
    }
  }
};



export default plugin;
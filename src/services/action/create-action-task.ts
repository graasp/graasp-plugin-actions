// global
import { FastifyRequest, FastifyReply, FastifyLoggerInstance } from 'fastify';
import { Actor, DatabaseTransactionHandler, Item, ItemService, Member } from 'graasp';
import geoip from 'geoip-lite';
// local
import { ActionService } from '../../db-service';
import { BaseActionTask } from './base-action-task';
import { Action } from '../../interfaces/action';
import { paths, ACTION_TYPES, METHODS, VIEW_UNKNOWN_NAME } from '../../constants/constants';
import { BaseAction } from './base-action';
import { Hostname } from '../../plugin';

export const buildActionsFromRequest = async (
  request: FastifyRequest,
  getItemFromDb: (id: string) => Promise<Item>,
  hosts: Hostname[],
  log: FastifyLoggerInstance,
): Promise<BaseAction[]> => {
  console.log('start ip', request.ip, request.hostname);
  // function called each time there is a request in the items in graasp (onResponse hook in graasp)
  // identify and check the correct endpoint of the request
  // check that the request is ok
  const { hostname, member, method, url, ip, query, params } = request;
  // warning: this is really dependent on the url -> how to be more safe and dynamic?
  const paramItemId: string = (params as { id: string })?.id;
  let queryItemIds = (query as { id })?.id;
  if (!Array.isArray(queryItemIds)) {
    queryItemIds = [queryItemIds];
  }
  const geolocation = geoip.lookup(ip);

  const view = hosts.find(({ hostname: thisHN }) => thisHN === hostname)?.name ?? VIEW_UNKNOWN_NAME;

  const actionsToSave = [];
  const actionBase = {
    memberId: member.id,
    memberType: member.type,
    extra: { memberId: member.id },
    view,
    geolocation,
  };

  // identify the endpoint with method and url
  // call createActionTask or createActionTaskMultipleItems to save the corresponding action
  switch (method) {
    case METHODS.GET:
      switch (true) {
        case paths.childrenItem.test(url):
          actionsToSave.push({
            ...actionBase,
            itemId: paramItemId,
            actionType: ACTION_TYPES.GET_CHILDREN,
            extra: { ...actionBase.extra, itemId: paramItemId },
          });
          break;
        case paths.baseItem.test(url):
          actionsToSave.push({
            ...actionBase,
            itemId: paramItemId,
            actionType: ACTION_TYPES.GET,
            extra: { ...actionBase.extra, itemId: paramItemId },
          });
          break;
      }
      break;
    case METHODS.POST:
      switch (true) {
        case paths.copyItem.test(url):
          const copyItemParentId = (request.body as { parentId: string })?.parentId;
          actionsToSave.push({
            ...actionBase,
            itemId: paramItemId,
            actionType: ACTION_TYPES.COPY,
            extra: { ...actionBase.extra, itemId: paramItemId, parentId: copyItemParentId },
          });
          break;
        case paths.copyItems.test(url):
          const copyItemsParentId = (request.body as { parentId: string })?.parentId;
          queryItemIds.forEach((id) => {
            actionsToSave.push({
              ...actionBase,
              itemId: id,
              actionType: ACTION_TYPES.COPY,
              extra: { ...actionBase.extra, itemId: id, parentId: copyItemsParentId },
            });
          });
          break;

        case paths.moveItem.test(url):
          const moveItemParentId = (request.body as { parentId: string })?.parentId;
          actionsToSave.push({
            ...actionBase,
            itemId: paramItemId,
            actionType: ACTION_TYPES.MOVE,
            extra: { ...actionBase.extra, itemId: paramItemId, parentId: moveItemParentId },
          });
          break;
        case paths.moveItems.test(url):
          const moveItemsParentId = (request.body as { parentId: string })?.parentId;
          queryItemIds.forEach((id) => {
            actionsToSave.push({
              ...actionBase,
              itemId: id,
              actionType: ACTION_TYPES.MOVE,
              extra: { ...actionBase.extra, itemId: id, parentId: moveItemsParentId },
            });
          });
          break;
      }
      break;
    case METHODS.PATCH:
      switch (true) {
        case paths.baseItem.test(url):
          actionsToSave.push({
            ...actionBase,
            itemId: paramItemId,
            actionType: ACTION_TYPES.UPDATE,
            extra: { ...actionBase.extra, itemId: paramItemId },
          });
          break;
        case paths.multipleItems.test(url):
          actionsToSave.push(
            ...queryItemIds.map((itemId) => ({
              ...actionBase,
              itemId: itemId,
              actionType: ACTION_TYPES.UPDATE,
              extra: { ...actionBase.extra, itemId },
            })),
          );
          break;
      }
    default:
      log.debug('action: request does not match any allowed routes.');
      break;
  }

  // get item specific data to put in actions
  const actions = await Promise.all(
    actionsToSave.map(async (action) => {
      // warning: no check over membership !
      const item = await getItemFromDb(action.itemId);
      // add item type
      return new BaseAction({ ...action, itemType: item.type });
    }),
  );

  return actions;
};

interface InputType {
  request: FastifyRequest;
  reply: FastifyReply;
}
export class CreateActionTask extends BaseActionTask<Action> {
  readonly action: Action;
  itemService: ItemService;
  hosts: Hostname[];

  input: InputType;
  getInput: () => InputType;

  get name(): string {
    return CreateActionTask.name;
  }

  constructor(
    actor: Actor,
    actionService: ActionService,
    itemService: ItemService,
    hosts: Hostname[],
    input: InputType,
  ) {
    super(actor, actionService);
    this.itemService = itemService;
    this.input = input;
    this.hosts = hosts;
  }

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = 'RUNNING';

    log.debug('create action');

    const { request, reply } = this.input;

    // create action only on successful requests
    if (reply.statusCode >= 200 && reply.statusCode < 300) {
      const getItemFromDb = (id) => this.itemService.get(id, handler);
      const actions = await buildActionsFromRequest(request, getItemFromDb, this.hosts, log);

      // save action
      this._result = await Promise.all(
        actions.map(async (action) => {
          const actionResult = await this.actionService.create(action, handler);
          return actionResult;
        }),
      );
    } else {
      this._result = null;
      log.debug('action not created for failed requests');
    }
    this.status = 'OK';
  }
}

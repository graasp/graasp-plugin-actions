import { Item, UnknownExtra } from 'graasp';
import { v4 } from 'uuid';
import { VIEW_UNKNOWN_NAME } from '../src/constants/constants';
import { GRAASP_ACTOR } from './constants';

export const getDummyItem = (): Item<UnknownExtra> => {
  const id = v4();
  return {
    id,
    name: 'item-name',
    description: 'item-description',
    type: 'item-type',
    path: id.split('.').join('_'),
    extra: {},
    creator: GRAASP_ACTOR.id,
    createdAt: '2021-03-29T08:46:52.939Z',
    updatedAt: '2021-03-29T08:46:52.939Z',
    settings: {},
  };
};

export const checkActionData = (savedAction, args) => {
  const {
    itemId,
    extraItemId,
    itemType,
    actionType,
    view = VIEW_UNKNOWN_NAME,
    memberId = GRAASP_ACTOR.id,
  } = args;
  expect(savedAction.itemId).toEqual(itemId);
  expect(savedAction.itemType).toEqual(itemType);
  expect(savedAction.memberId).toEqual(memberId);
  expect(savedAction.actionType).toEqual(actionType);
  expect(savedAction.view).toEqual(view);
  expect(savedAction.extra.itemId).toEqual(itemId ?? extraItemId);
  expect(savedAction.extra.memberId).toEqual(memberId);
  expect(savedAction.geolocation).toBeFalsy();
};

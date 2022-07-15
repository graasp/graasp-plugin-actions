import { VIEW_UNKNOWN_NAME } from '../src/constants/constants';
import { GRAASP_ACTOR } from './constants';

export const checkActionData = (savedAction, args) => {
  const {
    itemPath,
    itemId,
    extraItemId,
    itemType,
    actionType,
    view = VIEW_UNKNOWN_NAME,
    memberId = GRAASP_ACTOR.id,
  } = args;
  expect(savedAction.itemPath).toEqual(itemPath);
  expect(savedAction.itemType).toEqual(itemType);
  expect(savedAction.memberId).toEqual(memberId);
  expect(savedAction.actionType).toEqual(actionType);
  expect(savedAction.view).toEqual(view);
  expect(savedAction.extra.itemId).toEqual(itemId ?? extraItemId);
  expect(savedAction.extra.memberId).toEqual(memberId);
  expect(savedAction.geolocation).toBeFalsy();
};

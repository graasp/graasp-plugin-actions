import { Actor } from 'graasp';
import { v4 } from 'uuid';
import { CLIENT_HOSTS } from '../src/constants/constants';

export const GRAASP_ACTOR: Actor = {
  id: 'actorid',
};

export const CREATE_ACTION_WAIT_TIME = 1000;

export const createDummyAction = ({ itemId = v4(), view = 'view' }) => ({
  id: v4(),
  memberId: v4(),
  itemId,
  memberType: 'individual',
  itemType: 'folder',
  actionType: 'actionType',
  view,
  geolocation: null,
  extra: {},
  createdAt: Date.now(),
});

export const MOCK_ALL_VIEWS_ACTIONS = CLIENT_HOSTS.map(({ name }) => [
  createDummyAction({ view: name }),
]);

export const ITEM_TYPE = 'item';

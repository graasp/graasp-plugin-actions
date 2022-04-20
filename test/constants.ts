import { Actor } from 'graasp';
import { v4 } from 'uuid';
import { Action } from '../src/interfaces/action';

export const GRAASP_ACTOR: Actor = {
  id: 'actorid',
};

export const CREATE_ACTION_WAIT_TIME = 1000;

export const createDummyAction = ({ itemId = v4(), view = 'view' } = {}): Action => ({
  id: v4(),
  memberId: v4(),
  itemId,
  memberType: 'individual',
  itemType: 'folder',
  actionType: 'actionType',
  view,
  geolocation: null,
  extra: {},
  createdAt: Date.now().toString(),
});

export const ITEM_TYPE = 'item';

export const CLIENT_HOSTS = [
  {
    name: 'builder',
    hostname: 'builder.graasp.org',
  },
  {
    name: 'player',
    hostname: 'player.graasp.org',
  },
  {
    name: 'explorer',
    hostname: 'explorer.graasp.org',
  },
];

export const MOCK_ALL_VIEWS_ACTIONS = CLIENT_HOSTS.map(({ name }) => [
  createDummyAction({ view: name }),
]);

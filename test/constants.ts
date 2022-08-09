import { v4 } from 'uuid';

import { Action, Actor } from '@graasp/sdk';

export const GRAASP_ACTOR: Actor = {
  id: 'actorid',
};

export const CREATE_ACTION_WAIT_TIME = 1000;

export const createDummyAction = ({
  itemPath = v4().replace(/-/, '_'),
  view = 'view',
} = {}): Action => ({
  id: v4(),
  memberId: v4(),
  itemPath,
  memberType: 'individual',
  itemType: 'folder',
  actionType: 'actionType',
  view,
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

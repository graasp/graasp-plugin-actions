export const VIEW_UNKNOWN_NAME = 'unknown';
export const VIEW_BUILDER_NAME = 'builder';

export const ITEM_TYPE = 'item';

// todo: get from graasp constants
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

export enum ACTION_TYPES {
  GET = 'get',
  GET_CHILDREN = 'get_children',
  UPDATE = 'update',
  CREATE = 'create',
  DELETE = 'delete',
  COPY = 'copy',
  MOVE = 'move',
}

export enum METHODS {
  GET = 'GET',
  POST = 'POST',
  PATCH = 'PATCH',
}

export enum MemberType {
  Individual = 'individual',
  Group = 'group',
}

// todo: refactor from graasp utils? constants?
export const paths = {
  baseItem: /^\/items\/(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)$/,
  copyItem: /^\/items\/(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)\/copy/,
  copyItems: /^\/items\/copy\?id=(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)/,
  moveItem: /^\/items\/(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)\/move/,
  moveItems: /^\/items\/move\?id=(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)/,
  childrenItem: /^\/items\/(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)\/children/,
  multipleItems: /^\/items\?id=(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)/,
};

// Constants to check the validity of the query parameters when obtaining actions
export const DEFAULT_ACTIONS_SAMPLE_SIZE = 5000;
export const MIN_ACTIONS_SAMPLE_SIZE = 0;
export const MAX_ACTIONS_SAMPLE_SIZE = 10000;

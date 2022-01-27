export const VIEW_UNKNOWN_NAME = 'unknown'
export const VIEW_BUILDER_NAME = 'builder'

export enum ACTION_TYPES {
  GET = 'get',
  GET_CHILDREN = 'get_children',
  UPDATE = 'update',
  CREATE = 'create',
  DELETE = 'delete',
  DOWNLOAD = 'download',
  COPY = 'copy',
  MOVE = 'move',
}

export enum METHODS {
  GET = 'GET',
  POST = 'POST',
  PATCH = 'PATCH',
}

// todo: refactor from graasp utils? constants?
export const paths = {
  baseItem: /^\/items\/(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)$/,
  copyItem: /^\/items\/(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)\/copy$/,
  moveItem: /^\/items\/(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)\/move$/,
  downloadItem: /^\/items\/(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)\/download$/,
  childrenItem: /^\/items\/(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)\/children$/,
  multipleItems: /^\/items\?id=(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)/,
};

// Constants to check the validity of the query parameters when obtaining actions
export const DEFAULT_ACTIONS_SAMPLE_SIZE = 5000;
export const MIN_ACTIONS_SAMPLE_SIZE = 0;
export const MAX_ACTIONS_SAMPLE_SIZE = 10000;

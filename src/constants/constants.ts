import path from 'path';

export const VIEW_UNKNOWN_NAME = 'unknown';
export const VIEW_BUILDER_NAME = 'builder';

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

export const TMP_FOLDER_PATH = path.join(__dirname, 'tmp');

export const ZIP_MIMETYPE = 'application/zip';

export const DEFAULT_REQUEST_EXPORT_INTERVAL = 3600 * 1000 * 24; // 1 day - used for timestamp
export const EXPORT_FILE_EXPIRATION_DAYS = 7;
export const EXPORT_FILE_EXPIRATION = 3600 * 24 * EXPORT_FILE_EXPIRATION_DAYS; // max value: one week

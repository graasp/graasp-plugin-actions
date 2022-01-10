import { StatusCodes } from 'http-status-codes';

export enum VIEW_HOSTNAMES {
  BUILDER_HOSTNAME = 'builder.graasp.org', 
  PLAYER_HOSTNAME = 'player.graasp.org', 
  EXPLORER_HOSTNAME = 'explorer.graasp.org',
}

export enum View {
  BUILDER_NAME = 'builder', 
  PLAYER_NAME = 'player', 
  EXPLORER_NAME = 'explorer',
  UNKNOWN_NAME = 'unknown',
}

export enum ACTION_TYPES { 
  GET = 'get',
  GET_CHILDREN = 'get-children',
  UPDATE = 'update',
  CREATE = 'create',
  DELETE = 'delete',
  DOWNLOAD = 'download',
  COPY = 'copy',
  MOVE = 'move',
};

export enum METHODS { 
  GET = 'GET',
  POST = 'POST',
  PATCH = 'PATCH',
}

export const correctStatusCodes = [
  StatusCodes.OK, 
  StatusCodes.CREATED, 
  StatusCodes.ACCEPTED, 
  StatusCodes.NON_AUTHORITATIVE_INFORMATION, 
  StatusCodes.NO_CONTENT, 
  StatusCodes.RESET_CONTENT, 
  StatusCodes.PARTIAL_CONTENT, 
  StatusCodes.MULTI_STATUS
];

export const paths = {
    base: /\/items/,
    baseItem: /^\/items\/(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)/,
    copyItem: /^\/items\/(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)\/copy/,
    moveItem: /^\/items\/(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)\/move/,
    downloadItem: /^\/items\/(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)\/download/,
    childrenItem: /^\/items\/(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)\/children/,
    multipleItems: /^\/items\?id=(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)/,
  }

// Constants to check the validity of the query parameters when obtaining actions
export const DEFAULT_ACTIONS_SAMPLE_SIZE = 5000;
export const MIN_ACTIONS_SAMPLE_SIZE = 0;
export const MAX_ACTIONS_SAMPLE_SIZE = 10000;
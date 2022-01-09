import { StatusCodes } from 'http-status-codes';

export const VIEWS =  { BUILDER: {name: 'builder', hostname: 'builder.graasp.org'}, 
                        PLAYER: {name: 'player', hostname: 'player.graasp.org'}, 
                        EXPLORER: {name: 'explorer', hostname: 'explorer.graasp.org'},
                        UNKNOWN: {name: 'unknown'}
                      };

export const ACTION_TYPES = { GET: 'get',
                              GET_CHILDREN: 'get-children',
                              UPDATE: 'update',
                              CREATE: 'create',
                              DELETE: 'delete',
                              DOWNLOAD: 'download',
                              COPY: 'copy',
                              MOVE: 'move',
                            };

export const METHODS =  { GET: 'GET',
                          POST: 'POST',
                          PATCH: 'PATCH',
                        }

export const correctStatusCodes = [StatusCodes.OK, StatusCodes.CREATED, StatusCodes.ACCEPTED, StatusCodes.NON_AUTHORITATIVE_INFORMATION, StatusCodes.NO_CONTENT, StatusCodes.RESET_CONTENT, StatusCodes.PARTIAL_CONTENT, StatusCodes.MULTI_STATUS];

export const paths = {
    base: /\/items/,
    baseItem: /^\/items\/(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)/,
    copyItem: /^\/items\/(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)\/copy/,
    moveItem: /^\/items\/(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)\/move/,
    downloadItem: /^\/items\/(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)\/download/,
    childrenItem: /^\/items\/(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)\/children/,
    multipleItems: /^\/items\?id=(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)/
  }
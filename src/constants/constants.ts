const ID_FORMAT = '(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)';

export const correctStatusCodes = [200, 201, 202, 203, 204, 205, 206, 207];
export const views = ['builder', 'player', 'research', 'localhost'];

export const paths = {
    base: /\/items/,
    baseItem: /^\/items\/(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)/,
    copyItem: /^\/items\/(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)\/copy/,
    moveItem: /^\/items\/(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)\/move/,
    downloadItem: /^\/items\/(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)\/download/,
    childrenItem: /^\/items\/(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)\/children/,
    multipleItems: /^\/items\?id=(?=.*[0-9])(?=.*[a-zA-Z])([a-z0-9-]+)/
  }
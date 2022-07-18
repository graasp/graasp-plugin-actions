import { StatusCodes } from 'http-status-codes';

import { GraaspError, GraaspErrorDetails } from '@graasp/sdk';

export class GraaspActionError implements GraaspError {
  name: string;
  code: string;
  message: string;
  statusCode?: number;
  data?: unknown;
  origin: 'plugin' | string;

  constructor({ code, statusCode, message }: GraaspErrorDetails, data?: unknown) {
    this.name = code;
    this.code = code;
    this.message = message;
    this.statusCode = statusCode;
    this.data = data;
    this.origin = 'plugin';
  }
}

export class CannotWriteFileError extends GraaspActionError {
  constructor(data?: unknown) {
    super(
      {
        code: 'GPAERR001',
        statusCode: StatusCodes.NOT_FOUND,
        message: 'A file was not created properly for the requested archive',
      },
      data,
    );
  }
}

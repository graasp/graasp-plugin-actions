import { GraaspErrorDetails, GraaspError } from 'graasp';
import { StatusCodes } from 'http-status-codes';

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

export class EmptyActionError extends GraaspActionError {
  constructor(data?: unknown) {
    super(
      {
        code: 'GPAERR001',
        statusCode: StatusCodes.NOT_FOUND,
        message: 'No action to export for this item',
      },
      data,
    );
  }
}

export class ArchiveNotFound extends GraaspActionError {
  constructor(data?: unknown) {
    super(
      {
        code: 'GPAERR002',
        statusCode: StatusCodes.NOT_FOUND,
        message: 'The requested archive was not found',
      },
      data,
    );
  }
}

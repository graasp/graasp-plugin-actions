import { Actor } from 'graasp';
import {
  CreateRequestExportTask,
  CreateRequestExportTaskInputType,
} from './create-request-export-task';
import { RequestExportService } from './db-service';
import { GetRequestExportTask, GetRequestExportTaskInputType } from './get-request-export-task';

export class RequestExportTaskManager {
  requestExportService: RequestExportService;

  constructor(requestExportService: RequestExportService) {
    this.requestExportService = requestExportService;
  }

  createCreateTask(
    member: Actor,
    payload: CreateRequestExportTaskInputType,
  ): CreateRequestExportTask {
    return new CreateRequestExportTask(member, this.requestExportService, payload);
  }

  createGetTask(member: Actor, payload: GetRequestExportTaskInputType): GetRequestExportTask {
    return new GetRequestExportTask(member, this.requestExportService, payload);
  }
}

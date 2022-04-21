import { Actor } from 'graasp';
import {
  CreateRequestExportTask,
  CreateRequestExportTaskInputType,
} from './create-request-export-task';
import { RequestExportService } from './db-service';
import { GetLastRequestExportTask, GetLastRequestExportTaskInputType } from './get-request-export-task';

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

  createGetTask(member: Actor, payload: GetLastRequestExportTaskInputType): GetLastRequestExportTask {
    return new GetLastRequestExportTask(member, this.requestExportService, payload);
  }
}

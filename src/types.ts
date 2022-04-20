// global
import { FastifyLoggerInstance, FastifyReply, FastifyRequest } from 'fastify';
// local
import { BaseAction } from './services/action/base-action';
import { DatabaseTransactionHandler, Member } from 'graasp';
import { BaseAnalytics } from './services/action/base-analytics';

declare module 'fastify' {
  interface FastifyRequest {
    member: Member;
  }
}

export interface ActionHandlerInput {
  request: FastifyRequest;
  reply: FastifyReply;
  log: FastifyLoggerInstance;
  dbHandler: DatabaseTransactionHandler;
}

// type of the handler function responsible for building the action object
export type ActionHandler = (actionInput: ActionHandlerInput) => Promise<BaseAction[]>;

export type onExportSuccessFunction = (args: { itemId: string; datetime: string }) => void;
export type UploadArchiveFunction = (args: {
  filepath: string;
  itemId: string;
  datetime: string;
}) => Promise<void>;
export type GetBaseAnalyticsForViewsFunction = () => BaseAnalytics[];

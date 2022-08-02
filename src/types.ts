import { FastifyLoggerInstance, FastifyReply, FastifyRequest } from 'fastify';

import { DatabaseTransactionHandler, Member } from '@graasp/sdk';

import { BaseAction } from './services/action/base-action';
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

export type onExportSuccessFunction = (args: {
  itemId: string;
  dateString: string;
  timestamp: Date;
  filepath: string;
}) => void;
export type GetBaseAnalyticsForViewsFunction = () => BaseAnalytics[];

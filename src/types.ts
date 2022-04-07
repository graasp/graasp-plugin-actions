// global
import { FastifyLoggerInstance, FastifyReply, FastifyRequest } from 'fastify';
// local
import { BaseAction } from './services/action/base-action';
import { DatabaseTransactionHandler, Member } from 'graasp';

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

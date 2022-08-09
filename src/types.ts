import { Member } from '@graasp/sdk';

import { BaseAnalytics } from './services/action/base-analytics';

declare module 'fastify' {
  interface FastifyRequest {
    member: Member;
  }
}

export type onExportSuccessFunction = (args: {
  itemId: string;
  dateString: string;
  timestamp: Date;
  filepath: string;
}) => void;
export type GetBaseAnalyticsForViewsFunction = () => BaseAnalytics[];

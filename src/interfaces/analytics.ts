import { Action, Item, Member } from '@graasp/sdk';

export interface Analytics {
  actions: Action[];
  members: Member[];
  descendants: Item[];
  item: Item;
  metadata: {
    numActionsRetrieved: number;
    requestedSampleSize: number;
  };
}

export interface AnalyticsQueryParams {
  requestedSampleSize: number;
  view: string;
}

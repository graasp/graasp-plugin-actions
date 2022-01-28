import { Member, Item } from 'graasp';
import { Action } from './action';

export interface Analytics {
  actions: Action[];
  users: Member[];
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

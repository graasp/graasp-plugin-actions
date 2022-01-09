import { Member, Item } from "graasp";
import { Action } from "./action";

export interface Analytics {
  actions: Action[],
  users: Member[],
  item: Item,
  metadata: {
    numActionsRetrieved: number,
    requestedSampleSize: number
  }
}

export interface ItemIdParam {
  itemId: string;
}

export interface AnalyticsQueryParams {
  requestedSampleSize: string;
  view: string;
}
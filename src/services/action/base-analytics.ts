import { Action, Item, ItemMembership, Member } from '@graasp/sdk';

import { Analytics } from '../../interfaces/analytics';

export class BaseAnalytics implements Analytics {
  readonly actions: Action[];
  readonly members: Member[];
  readonly itemMemberships: ItemMembership[];
  readonly descendants: Item[];
  readonly item: Item;
  readonly metadata: {
    numActionsRetrieved: number;
    requestedSampleSize: number;
  };

  constructor(args: {
    item: Item;
    descendants: Item[];
    actions: Action[];
    members: Member[];
    itemMemberships: ItemMembership[];
    metadata: {
      numActionsRetrieved: number;
      requestedSampleSize: number;
    };
  }) {
    this.actions = args.actions;
    this.members = args.members;
    this.item = args.item;
    this.descendants = args.descendants;
    this.metadata = args.metadata;
    this.itemMemberships = args.itemMemberships;
  }
}

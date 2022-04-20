// global
import { Member, Item, ItemMembership } from 'graasp';
// local
import { Analytics } from '../../interfaces/analytics';
import { Action } from '../../interfaces/action';

export class BaseAnalytics implements Analytics {
  readonly actions: Action[];
  readonly members: Member[];
  readonly itemMemberships: ItemMembership[];
  readonly item: Item;
  readonly metadata: {
    numActionsRetrieved: number;
    requestedSampleSize: number;
  };

  constructor(args: {
    actions: Action[];
    members: Member[];
    itemMemberships: ItemMembership[];
    item: Item;
    metadata: {
      numActionsRetrieved: number;
      requestedSampleSize: number;
    };
  }) {
    this.actions = args.actions;
    this.members = args.members;
    this.item = args.item;
    this.metadata = args.metadata;
    this.itemMemberships = args.itemMemberships;
  }
}

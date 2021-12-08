// global
import { Member, Item } from 'graasp';
// local
import { Analytics } from '../../interfaces/analytics';
import { Action } from '../../interfaces/action';

export class BaseAnalytics implements Analytics {
  readonly actions: Action[];
  readonly users: Member[];
  readonly item: Item;
  readonly metadata: {
    numActionsRetrieved: number;
    requestedSampleSize: number;
  };

  constructor(
    actions: Action[],
    users: Member[],
    item: Item,
    metadata: {
      numActionsRetrieved: number;
      requestedSampleSize: number;
    },
  ) {
    this.actions = actions;
    this.users = users;
    this.item = item;
    this.metadata = metadata;
  }
}

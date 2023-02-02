import Ajv from 'ajv';

import { Item, ItemMembership, Member } from '@graasp/sdk';

import { Action } from '../../interfaces/action';
import { Analytics } from '../../interfaces/analytics';
import { memberSchemaForAnalytics } from '../../schemas/schemas';

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
    // TODO: all other schemas

    // members: validate and remove additional properties
    const ajv = new Ajv({ removeAdditional: 'all' });
    const validateMembers = ajv.compile(memberSchemaForAnalytics);
    validateMembers(args.members);

    this.actions = args.actions;
    this.members = args.members;
    this.item = args.item;
    this.descendants = args.descendants;
    this.metadata = args.metadata;
    this.itemMemberships = args.itemMemberships;
  }
}

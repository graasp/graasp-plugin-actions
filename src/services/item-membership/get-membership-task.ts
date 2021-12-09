// global
import {
  DatabaseTransactionHandler,
  Item,
  Member,
  ItemMembership,
  ItemMembershipService,
  PermissionLevel,
} from 'graasp';

// local
import { BaseItemMembershipTask } from './base-item-membership-task';

export type GetMemberItemMembershipOverItemTaskInputType = { item?: Item, validatePermission?: PermissionLevel };

export class GetMembershipTask extends BaseItemMembershipTask<ItemMembership[]> {
  readonly item: Item;

  get name(): string { return GetMembershipTask.name; }

  input: GetMemberItemMembershipOverItemTaskInputType;
  getInput: () => GetMemberItemMembershipOverItemTaskInputType;

  constructor(member: Member, item: Item, itemMembershipService: ItemMembershipService) {
    super(member, itemMembershipService);
    this.item = item;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = 'RUNNING';

    // get memberships
    const membershipResult = await this.itemMembershipService.getAllInSubtree(this.item, handler);

    this.status = 'OK';
    this._result = membershipResult;
  }
}
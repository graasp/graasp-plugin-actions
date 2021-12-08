// global
import {
    Actor,
    DatabaseTransactionHandler,
    Item,
    ItemMembership,
    ItemService,
    UnknownExtra,
  } from 'graasp';
  // local
  import { BaseItemTask } from './base-item-task';
  
  interface ItemWithMemberships<E extends UnknownExtra> extends Item<E> {
    itemMemberships?: ItemMembership[];
  }
  
  export class GetItemTask<E extends UnknownExtra> extends BaseItemTask<
    ItemWithMemberships<E>
  > {
    get name(): string {
      return GetItemTask.name;
    }
  
    constructor(
      actor: Actor,
      itemId: string,
      itemService: ItemService,

    ) {
      super(actor, itemService);
      this.targetId = itemId;
    }
  
    async run(handler: DatabaseTransactionHandler): Promise<void> {
      this.status = 'RUNNING';
  
      // get item
      const item = await this.itemService.get<E>(this.targetId, handler);
  
      this._result = item;
      this.status = 'OK';
    }
  }
// global
import { Serializable } from 'graasp';
import { v4 as uuidv4 } from 'uuid';
// local
import { Action } from '../../interfaces/action';

export class BaseAction implements Action {
  readonly id: string;
  readonly memberId: string;
  readonly itemId: string;
  memberType: string;
  itemType: string;
  actionType: string;
  view: string;
  geolocation?: Serializable;
  extra: Serializable;
  readonly createdAt: string;

  constructor(args: {
    memberId: string;
    itemId?: string;
    memberType: string;
    itemType: string;
    actionType: string;
    view: string;
    geolocation?: Serializable;
    extra: Serializable;
  }) {
    const { memberId, itemId, memberType, itemType, actionType, view, geolocation, extra } = args;
    this.id = uuidv4();
    this.memberId = memberId;
    this.itemId = itemId;
    this.memberType = memberType;
    this.itemType = itemType;
    this.actionType = actionType;
    this.view = view;
    this.geolocation = geolocation;
    this.extra = extra;
  }
}

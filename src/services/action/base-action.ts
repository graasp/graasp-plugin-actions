// global
import { v4 as uuidv4 } from 'uuid';
import { UnknownExtra } from 'graasp';
// local
import { Action } from '../../interfaces/action';

export class BaseAction<E extends UnknownExtra> implements Action<E> {

  readonly id: string;
  readonly memberId: string;
  readonly itemId: string;
  memberType: string;
  itemType: string;
  actionType: string;
  view: string;
  extra: E;
  readonly createdAt: string;

  constructor(
    memberId: string,
    itemId: string,
    memberType: string,
    itemType: string,
    actionType: string,
    view: string,
    extra: E
  ) {
    this.id = uuidv4();
    this.memberId = memberId;
    this.itemId = itemId;
    this.memberType = memberType;
    this.itemType = itemType;
    this.actionType = actionType;
    this.view = view;
    this.extra = extra;
  }

}

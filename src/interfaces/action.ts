// local
import { Serializable } from 'graasp';

export interface Action {
  id: string;
  memberId: string;
  itemId: string;
  memberType: string;
  itemType: string;
  actionType: string;
  view: string;
  extra: Serializable;
  createdAt: string;
  geolocation?: Serializable;
}

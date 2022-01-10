import { UnknownExtra } from "graasp";

// local
import { View } from '../constants/constants';

export interface Action<T extends UnknownExtra = UnknownExtra> {
  id: string;
  memberId: string;
  itemId: string;
  memberType: string;
  itemType: string;
  actionType: string;
  view: View;
  geolocation: T;
  extra: T;
  createdAt: string;
}
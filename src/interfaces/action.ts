import { UnknownExtra } from "graasp";

export interface Action<T extends UnknownExtra = UnknownExtra> {
  id: string;
  memberId: string;
  itemId: string;
  memberType: string;
  itemType: string;
  actionType: string;
  view: string;
  geolocation: T;
  extra: T;
  createdAt: string;
}
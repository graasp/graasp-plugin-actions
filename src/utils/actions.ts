import geoip from 'geoip-lite';
import { DatabaseTransactionConnection } from 'slonik';

import forwarded from '@fastify/forwarded';
import { FastifyRequest } from 'fastify';

import { Action, Context, Hostname, Item, Member, Serializable } from '@graasp/sdk';

export const getGeolocationIp = (ip: string | number): geoip.Lookup => geoip.lookup(ip);
export const getView = (headers: { origin?: string | string[] }, hosts: Hostname[]): string =>
  hosts.find(({ hostname: thisHN }) => headers?.origin?.includes(thisHN))?.name ?? Context.UNKNOWN;

export const getBaseAction = (
  request: FastifyRequest,
  hosts: Hostname[],
): Pick<Action, 'memberId' | 'memberType' | 'geolocation' | 'view' | 'extra'> => {
  const { member, headers } = request;
  const view = getView(headers, hosts);
  // warning: addresses might contained spoofed ips
  const addresses = forwarded(request.raw);
  const ip = addresses.pop();
  const geolocation = getGeolocationIp(ip) as unknown as Serializable;
  return {
    memberId: member.id,
    memberType: member.type,
    geolocation,
    view,
    extra: { memberId: member.id },
  };
};

// TODO: allow undefined values?
// decorate?
export const shouldSaveAForItemAndMember = (
  action: Action,
  {
    item,
    member,
  }: {
    item?: Item;
    handler: DatabaseTransactionConnection;
    member?: Member;
  },
): boolean => {
  let itemCondition = true;
  if (item) {
    itemCondition = Boolean(item?.settings?.enableActions);
  }
  let memberCondition = true;
  if (member) {
    memberCondition = Boolean(member?.extra?.enableActions);
  }

  return itemCondition && memberCondition;
};

import geoip from 'geoip-lite';

import forwarded from '@fastify/forwarded';
import { FastifyRequest } from 'fastify';

import { Action, Hostname, Serializable } from '@graasp/sdk';

import { VIEW_UNKNOWN_NAME } from '../constants/constants';

const getGeolocationIp = (ip: string | number): geoip.Lookup => geoip.lookup(ip);
const getView = (headers: { origin?: string | string[] }, hosts: Hostname[]): string =>
  hosts.find(({ hostname: thisHN }) => headers?.origin?.includes(thisHN))?.name ??
  VIEW_UNKNOWN_NAME;

const getBaseAction = (request: FastifyRequest, hosts: Hostname[]): Partial<Action> => {
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

export { getGeolocationIp, getView, getBaseAction };

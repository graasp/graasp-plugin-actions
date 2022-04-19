import { CLIENT_HOSTS } from '../constants/constants';
import { VIEW_UNKNOWN_NAME } from '../constants/constants';
import geoip from 'geoip-lite';
import { FastifyRequest } from 'fastify';
import { BaseAction } from '../services/action/base-action';
import { Serializable } from 'graasp';

const getGeolocationIp = (ip: string | number): geoip.Lookup => geoip.lookup(ip);
const getView = (headers: { origin?: string | string[] }): string =>
  CLIENT_HOSTS.find(({ hostname: thisHN }) => headers?.origin?.includes(thisHN))?.name ??
  VIEW_UNKNOWN_NAME;

const getBaseAction = (request: FastifyRequest): Partial<BaseAction> => {
  const { member, ip, headers } = request;
  const view = getView(headers);
  const geolocation = getGeolocationIp(ip) as unknown as Serializable;
  return {
    memberId: member.id,
    memberType: member.type,
    geolocation,
    view,
  };
};

export { getGeolocationIp, getView, getBaseAction };

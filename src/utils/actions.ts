import { CLIENT_HOSTS } from '../constants/constants';
import { VIEW_UNKNOWN_NAME } from '../constants/constants';
import geoip from 'geoip-lite';

const getGeolocationIp = (ip: string | number): geoip.Lookup => geoip.lookup(ip);
const getView = (headers: { origin?: string | string[] }): string =>
  CLIENT_HOSTS.find(({ hostname: thisHN }) => headers?.origin?.includes(thisHN))?.name ??
  VIEW_UNKNOWN_NAME;

export { getGeolocationIp, getView };

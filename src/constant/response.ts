import { EnvironmentVariables } from '../interfaces/interface';

export const API_BASE = '/api/v1';
export const envAlias = process.env as any as EnvironmentVariables;
export const NODE_ENV = envAlias.NODE_ENV;
export const SERVICE = 'user';

export const PG_CRED = {
  DBNAME: envAlias.DBNAME,
  USER_NAME: envAlias.USER_NAME,
  PASSWORD: envAlias.PASSWORD,
  HOST_NAME: envAlias.HOST_NAME,
};

export const RESPONSES = {
  SUCCESS: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NOCONTENT: 204,
  BADREQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOTFOUND: 404,
  TIMEOUT: 408,
  TOOMANYREQ: 429,
  INTERNALSERVER: 500,
  BADGATEWAYS: 502,
  SERVICEUNAVILABLE: 503,
  GATEWAYTIMEOUT: 504,
};

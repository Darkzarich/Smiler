import Config from '@config/index';

export const allowedOrigins = [
  Config.FRONT_ORIGIN_LOCAL,
  Config.FRONT_ORIGIN_REMOTE,
  `http://localhost:${Config.PORT}`,
].filter((origin): origin is string => Boolean(origin));

export function isAllowedOrigin(origin: string) {
  return allowedOrigins.includes(origin);
}

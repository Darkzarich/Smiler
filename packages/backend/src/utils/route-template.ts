import type { Request, RequestHandler } from 'express';

function stringifyRoutePath(path: unknown): string {
  if (typeof path === 'string') {
    return path;
  }

  if (path instanceof RegExp) {
    return '[pattern]';
  }

  if (Array.isArray(path)) {
    return path.map(stringifyRoutePath).join('|');
  }

  return '[unknown]';
}

/**
 * Remember where a sub-router is mounted, while `req.baseUrl` still says so.
 *
 * Express restores `baseUrl` to the outer router's value as the stack unwinds,
 * and an error unwinds it — a request that ends in `res.json()` never does.
 * Reading it once the response is over therefore truncates the route for failed
 * requests only (`/api/:login` in place of `/api/users/:login`), which is
 * precisely the case worth identifying. Mounted alongside each sub-router, this
 * runs while the mount path is still current and before anything can reject the
 * request, so middleware-rejected requests keep their route too.
 */
export function captureRouteBaseUrl(): RequestHandler {
  return (req, _res, next) => {
    req.routeBaseUrl = req.baseUrl;

    next();
  };
}

/**
 * The low-cardinality name of the endpoint (`/api/posts/:slug`), for grouping
 * log lines by route rather than by the values that happened to be in the URL.
 */
export function getRouteTemplate(req: Request): string {
  if (!req.route) {
    return '[unmatched]';
  }

  return `${req.routeBaseUrl ?? req.baseUrl}${stringifyRoutePath(req.route.path)}`;
}

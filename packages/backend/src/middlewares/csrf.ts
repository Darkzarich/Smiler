import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError, ERRORS } from '@errors';
import { isAllowedOrigin } from '@utils/allowed-origins';

const CSRF_HEADER = 'x-csrf-token';
const CSRF_TOKEN_BYTES = 32;
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const AUTH_TOKEN_REQUIRED_PATHS = new Set([
  '/auth/signin',
  '/auth/signup',
  '/api/auth/signin',
  '/api/auth/signup',
]);

export function createCsrfToken() {
  return crypto.randomBytes(CSRF_TOKEN_BYTES).toString('hex');
}

export function getOrCreateCsrfToken(req: Request) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = createCsrfToken();
  }

  return req.session.csrfToken;
}

function shouldRequireCsrfToken(req: Request) {
  const originalPath = req.originalUrl.split('?')[0];

  return Boolean(
    req.session?.userId ||
      AUTH_TOKEN_REQUIRED_PATHS.has(req.path) ||
      AUTH_TOKEN_REQUIRED_PATHS.has(originalPath),
  );
}

function getHeaderValue(req: Request, header: string) {
  return req.get(header);
}

function getRefererOrigin(req: Request) {
  const referer = getHeaderValue(req, 'referer');

  if (!referer) {
    return undefined;
  }

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

function requestHasAllowedBrowserOrigin(req: Request) {
  const origin = getHeaderValue(req, 'origin');

  if (origin) {
    return isAllowedOrigin(origin);
  }

  const refererOrigin = getRefererOrigin(req);

  if (refererOrigin === null) {
    return false;
  }

  if (refererOrigin) {
    return isAllowedOrigin(refererOrigin);
  }

  return true;
}

function isValidToken(req: Request) {
  const actualToken = getHeaderValue(req, CSRF_HEADER);
  const expectedToken = req.session.csrfToken;

  if (!actualToken || !expectedToken) {
    return false;
  }

  const actualTokenBuffer = Buffer.from(actualToken);
  const expectedTokenBuffer = Buffer.from(expectedToken);

  return (
    actualTokenBuffer.length === expectedTokenBuffer.length &&
    crypto.timingSafeEqual(actualTokenBuffer, expectedTokenBuffer)
  );
}

export function csrfProtectionMiddleware(
  req: Request,
  _: Response,
  next: NextFunction,
) {
  if (SAFE_METHODS.has(req.method)) {
    next();

    return;
  }

  if (!shouldRequireCsrfToken(req)) {
    next();

    return;
  }

  // CSRF token checks are needed because this API authenticates browser users
  // with cookies/session, which browsers attach automatically to cross-site requests.
  if (!requestHasAllowedBrowserOrigin(req) || !isValidToken(req)) {
    next(new ForbiddenError(ERRORS.CSRF_INVALID));

    return;
  }

  next();
}

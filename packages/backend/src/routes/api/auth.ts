import { current, signIn, signUp, logout } from '@controllers/auth';
import { createApiRouter } from '@libs/api-router';
import { getOrCreateCsrfToken } from '@middlewares/csrf';
import { apiRateLimiter, authRateLimiter } from '@middlewares/rate-limiter';
import {
  authStateSchema,
  csrfTokenResponseSchema,
  signInBodySchema,
  signUpBodySchema,
} from '@validators/auth';
import { okResponseSchema } from '@validators/common';

const api = createApiRouter({
  prefix: '/auth',
  tag: 'Auth',
  tagDescription: 'Signing in and out, and the tokens that protect it',
});

const sessionCookieHeader = {
  'Set-Cookie': {
    description: 'The session cookie, to be sent with every later request',
    schema: { type: 'string', examples: ['smiler.sid=abcde12345; Path=/'] },
  },
};

api.get({
  path: '/current',
  summary: 'Who the current session belongs to',
  description:
    'Answers for a request without a session too, with `isAuth: false`, so the client can ask once on load.',
  rateLimiter: apiRateLimiter,
  responses: {
    200: { description: 'The current auth state', schema: authStateSchema },
  },
  handler: current,
});

api.get({
  path: '/csrf',
  summary: 'Get a CSRF token',
  description:
    'Creates or returns the token of the current session. Unsafe requests made with a session — and sign-in and sign-up, which create one — must send it in the `X-CSRF-Token` header.',
  rateLimiter: apiRateLimiter,
  responses: {
    200: {
      description: "The session's CSRF token",
      schema: csrfTokenResponseSchema,
    },
  },
  handler: (req, res) => {
    res.json({ csrfToken: getOrCreateCsrfToken(req) });
  },
});

api.post({
  path: '/signin',
  summary: 'Sign in',
  csrf: true,
  rateLimiter: authRateLimiter,
  request: { body: signInBodySchema },
  responses: {
    200: {
      description: 'Signed in',
      schema: authStateSchema,
      headers: sessionCookieHeader,
    },
    401: { description: 'No account with that email and password' },
  },
  handler: signIn,
});

api.post({
  path: '/signup',
  summary: 'Sign up',
  description: 'Creates the account and signs it in, in one request.',
  csrf: true,
  rateLimiter: authRateLimiter,
  request: { body: signUpBodySchema },
  responses: {
    200: {
      description: 'The account was created and signed in',
      schema: authStateSchema,
      headers: sessionCookieHeader,
    },
    409: { description: 'The email or the login is already taken' },
  },
  handler: signUp,
});

api.post({
  path: '/logout',
  summary: 'Log out the current user',
  auth: true,
  rateLimiter: apiRateLimiter,
  responses: {
    200: { description: 'The session was destroyed', schema: okResponseSchema },
  },
  handler: logout,
});

export default api.router;

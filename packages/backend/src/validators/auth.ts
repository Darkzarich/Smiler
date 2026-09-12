import { z } from 'zod';
import { ERRORS } from '@errors';
import { apiSchema } from '@libs/openapi/registry';
import { normalizeEmail, normalizeLogin } from '@models/User';

const LOGIN_MIN_LENGTH = 3;
const LOGIN_MAX_LENGTH = 15;
const PASSWORD_MIN_LENGTH = 6;

/**
 * Deliberately lax: one `@` and a dot after it. Accounts were created against
 * this pattern for years, so a stricter check here would lock their owners out
 * of an account they can still sign in to everywhere else.
 */
const EMAIL_PATTERN = /^[^@]+@[^@]+\.[^@]+$/;

/** Normalized first, then checked, so `  Me@Example.COM ` is the same address
 * as the stored one rather than an invalid one. */
const email = z
  .string({ error: ERRORS.AUTH_FIELDS_REQUIRED })
  .transform(normalizeEmail)
  .pipe(
    z
      .string()
      .min(1, ERRORS.AUTH_FIELDS_REQUIRED)
      .regex(EMAIL_PATTERN, ERRORS.AUTH_INVALID_EMAIL),
  )
  .meta({ format: 'email', examples: ['reader@example.com'] });

const password = z
  .string({ error: ERRORS.AUTH_FIELDS_REQUIRED })
  .min(1, ERRORS.AUTH_FIELDS_REQUIRED)
  .min(PASSWORD_MIN_LENGTH, ERRORS.AUTH_PASSWORD_TOO_SHORT)
  .meta({ format: 'password' });

/** The fields are checked in the order they are declared, and the client is
 * told about the first problem — so they read the way the sign-up form does. */
export const signUpBodySchema = apiSchema(
  'SignUpBody',
  z
    .object({
      login: z
        .string({ error: ERRORS.AUTH_FIELDS_REQUIRED })
        .transform(normalizeLogin)
        .pipe(
          z
            .string()
            .min(1, ERRORS.AUTH_FIELDS_REQUIRED)
            .min(LOGIN_MIN_LENGTH, ERRORS.AUTH_LOGIN_WRONG_LENGTH)
            .max(LOGIN_MAX_LENGTH, ERRORS.AUTH_LOGIN_WRONG_LENGTH),
        )
        .meta({
          minLength: LOGIN_MIN_LENGTH,
          maxLength: LOGIN_MAX_LENGTH,
          examples: ['reader'],
        }),
      password,
      confirm: z
        .string({ error: ERRORS.AUTH_FIELDS_REQUIRED })
        .min(1, ERRORS.AUTH_FIELDS_REQUIRED)
        .describe('Must match `password`'),
      email,
    })
    .check((ctx) => {
      if (ctx.value.password !== ctx.value.confirm) {
        ctx.issues.push({
          code: 'custom',
          message: ERRORS.AUTH_PASSWORDS_NOT_EQUAL,
          input: ctx.value,
          path: ['confirm'],
        });
      }
    }),
);

export const signInBodySchema = apiSchema(
  'SignInBody',
  z.object({ email, password }),
);

const signedInStateSchema = z.object({
  _id: z.string(),
  login: z.string(),
  isAuth: z.literal(true),
  rating: z.number(),
  avatar: z.string(),
  email: z.string(),
  tagsFollowed: z.array(z.string()),
  followersAmount: z.number(),
});

/** Who the session belongs to, or that it belongs to nobody. */
export const authStateSchema = apiSchema(
  'AuthState',
  z.union([signedInStateSchema, z.object({ isAuth: z.literal(false) })]),
);

export const csrfTokenResponseSchema = apiSchema(
  'CsrfToken',
  z.object({
    csrfToken: z
      .string()
      .describe('Send it back in the `X-CSRF-Token` header of unsafe requests'),
  }),
);

export type SignUpBody = z.infer<typeof signUpBodySchema>;
export type SignInBody = z.infer<typeof signInBodySchema>;

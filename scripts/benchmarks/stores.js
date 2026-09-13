/**
 * Measures what the rate limiter and the session add to a request.
 *
 * `GET /api/auth/current` is the cheapest rate limited endpoint there is: without
 * a session it answers `isAuth: false` without touching the database, so the
 * `anonymous` scenario is almost entirely the rate limiter's store. With one it
 * reads the session and one user document, so the `authenticated` scenario adds
 * the session store on top. Only the stores change between runs — the endpoint
 * does not — so the difference between two runs is the difference between two
 * store backends.
 *
 * Usage: see "Benchmarks" in AGENTS.md. Raise every RATE_LIMIT_*_MAX for the run
 * or the limits are what gets measured.
 */

import http from 'k6/http';
import { check, fail } from 'k6';
import { Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ORIGIN = __ENV.ORIGIN || 'http://localhost:8080';
const SESSION_COOKIE_NAME = 'smiler.sid';
const VUS = Number(__ENV.VUS || 50);
const DURATION = __ENV.DURATION || '30s';
const ONLY = __ENV.SCENARIO;

const anonymousDuration = new Trend('anonymous_duration', true);
const authenticatedDuration = new Trend('authenticated_duration', true);

const scenario = (exec, startTime) => ({
  executor: 'constant-vus',
  vus: VUS,
  duration: DURATION,
  gracefulStop: '0s',
  exec,
  startTime,
});

const allScenarios = {
  anonymous: scenario('anonymous', '0s'),
  authenticated: scenario('authenticated', DURATION),
};

export const options = {
  scenarios: ONLY ? { [ONLY]: scenario(ONLY, '0s') } : allScenarios,
  thresholds: {
    checks: ['rate>0.99'],
    http_req_failed: ['rate<0.01'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(95)', 'p(99)', 'max'],
};

function signUp() {
  const csrf = http.get(`${BASE_URL}/api/auth/csrf`);

  if (csrf.status !== 200) {
    fail(`GET /api/auth/csrf answered ${csrf.status}, expected 200`);
  }

  const login = `bench${String(Date.now()).slice(-8)}`;
  const password = 'benchmark-password';

  const response = http.post(
    `${BASE_URL}/api/auth/signup`,
    JSON.stringify({
      login,
      password,
      confirm: password,
      email: `${login}@example.com`,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrf.json('csrfToken'),
        Origin: ORIGIN,
      },
    },
  );

  if (response.status !== 200) {
    fail(`sign-up answered ${response.status}: ${response.body}`);
  }

  const jarCookies = http.cookieJar().cookiesForURL(BASE_URL);
  const sessionCookie = (jarCookies[SESSION_COOKIE_NAME] || [])[0];

  if (!sessionCookie) {
    fail(`sign-up did not set the ${SESSION_COOKIE_NAME} cookie`);
  }

  return `${SESSION_COOKIE_NAME}=${sessionCookie}`;
}

export function setup() {
  const probe = http.get(`${BASE_URL}/api/auth/current`);

  if (probe.status === 429) {
    fail(
      'rate limited before the run started — raise the RATE_LIMIT_*_MAX values',
    );
  }

  if (probe.status !== 200) {
    fail(
      `${BASE_URL} answered ${probe.status}, expected 200 — is the backend running?`,
    );
  }

  return { sessionCookie: signUp() };
}

export function anonymous() {
  const response = http.get(`${BASE_URL}/api/auth/current`);

  anonymousDuration.add(response.timings.duration);

  check(response, {
    'anonymous: 200': (r) => r.status === 200,
  });
}

export function authenticated(data) {
  const response = http.get(`${BASE_URL}/api/auth/current`, {
    headers: { Cookie: data.sessionCookie },
  });

  authenticatedDuration.add(response.timings.duration);

  check(response, {
    'authenticated: 200 and the session resolved': (r) =>
      r.status === 200 && r.json('isAuth') === true,
  });
}

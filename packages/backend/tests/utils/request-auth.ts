import type { Express } from 'express';
import request from 'supertest'; /** Signs up a test user and returns a session cookie and the user object
 * it's important for test cases that require a logged in user
 */
export async function signUpRequest(app: Express) {
  const response = await request(app).post('/api/auth/signup').send({
    login: 'currentUser',
    email: 'test-user@test.com',
    password: '123456',
    confirm: '123456',
  });

  const sessionCookie = response.headers['set-cookie'][0];

  return {
    currentUser: response.body,
    sessionCookie,
  };
}

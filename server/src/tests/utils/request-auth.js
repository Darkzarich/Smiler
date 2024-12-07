import request from 'supertest';

/** Signs up a test user and returns a session cookie and the user object
 * it's important for test cases that require a logged in user
 */
export async function signUpRequest(app) {
  const response = await request(app).post('/api/auth/signup').send({
    login: 'currentUser',
    email: 'current-user@gmail.com',
    password: '123456',
    confirm: '123456',
  });

  const sessionCookie = response.headers['set-cookie'][0];

  return {
    currentUser: response.body,
    sessionCookie,
  };
}
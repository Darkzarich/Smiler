const request = require('supertest');
const { startApp } = require('../../app');

let app;

beforeAll(async () => {
  const resolvedApp = await startApp();

  app = resolvedApp.app;
});

describe('GET /not-existing-route', () => {
  it('Should return status 404 and an expected error message', async () => {
    const response = await request(app).get('/api/not-existing-route');

    expect(response.status).toBe(404);
    expect(response.text).toBe('Not Found');
  });
});

describe('Internal Server Error handled globally', () => {
  it('Should return status 500 and an expected error message', async () => {
    const response = await request(app).get('/api/error-endpoint');

    expect(response.status).toBe(500);
    expect(response.body.error).toMatchObject({
      message: 'Internal server error',
    });
  });
});

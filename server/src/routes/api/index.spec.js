import request from 'supertest';
import App from '../../app.js';

let app;

beforeAll(async () => {
  const resolvedApp = await App.startApp();

  app = resolvedApp.app;
});

describe('GET /not-existing-route', () => {
  it('Should return status 404 and an expected error message', async () => {
    const response = await request(app).get('/api/not-existing-route');

    expect(response.body.error.message).toBe('Not Found');
    expect(response.status).toBe(404);
  });
});

describe('Internal Server Error handled globally', () => {
  it('Should return status 500 and an expected error message', async () => {
    const response = await request(app).get('/api/error-endpoint');

    expect(response.status).toBe(500);
    expect(response.body.error).toMatchObject({
      message: 'Something went wrong on the server. Please try again later.',
    });
  });
});

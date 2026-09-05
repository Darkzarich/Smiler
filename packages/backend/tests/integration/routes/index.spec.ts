import request from 'supertest';

describe('GET /not-existing-route', () => {
  it('Should return status 404 and an expected error message', async () => {
    const response = await request(global.app).get('/api/not-existing-route');

    expect(response.body.error.message).toBe('Not Found');
    expect(response.status).toBe(404);
  });
});

describe('Internal Server Error handled globally', () => {
  it('Should return status 500 and an expected error message', async () => {
    const response = await request(global.app).get('/api/error-endpoint');

    expect(response.status).toBe(500);
    expect(response.body.error).toMatchObject({
      message: 'Something went wrong on the server. Please try again later.',
    });
  });
});

describe('MongoDB errors handled globally', () => {
  it('Should map a CastError to status 422 and a generic message', async () => {
    const response = await request(global.app).get('/api/cast-error-endpoint');

    expect(response.status).toBe(422);
    expect(response.body.error).toMatchObject({
      message: 'The request contains invalid or malformed data',
    });
  });

  it('Should map a duplicate key error to status 409 and a generic message', async () => {
    const response = await request(global.app).get(
      '/api/duplicate-key-error-endpoint',
    );

    expect(response.status).toBe(409);
    expect(response.body.error).toMatchObject({
      message: 'This operation conflicts with an existing resource',
    });
  });
});

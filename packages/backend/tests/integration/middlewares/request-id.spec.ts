import request from 'supertest';

const REQUEST_HEADER = 'X-Request-Id';
const UUID_REGEXP =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('requestIdMiddleware', () => {
  it('Should preserve a safe request id from the request header', async () => {
    const requestId = 'frontend-request_123.abc';

    const response = await request(global.app)
      .get('/api/not-found')
      .set(REQUEST_HEADER, requestId);

    expect(response.get(REQUEST_HEADER)).toBe(requestId);
  });

  it('Should preserve a UUID request id from the request header', async () => {
    const requestId = '98588843-553c-4f0b-8551-082ccb2c2d30';

    const response = await request(global.app)
      .get('/api/not-found')
      .set(REQUEST_HEADER, requestId);

    expect(response.get(REQUEST_HEADER)).toBe(requestId);
  });

  it('Should replace unsafe request ids from the request header', async () => {
    const unsafeRequestId = 'x'.repeat(1024);

    const response = await request(global.app)
      .get('/api/not-found')
      .set(REQUEST_HEADER, unsafeRequestId);

    const responseRequestId = response.get(REQUEST_HEADER);

    expect(responseRequestId).not.toBe(unsafeRequestId);
    expect(responseRequestId).toMatch(UUID_REGEXP);
  });
});

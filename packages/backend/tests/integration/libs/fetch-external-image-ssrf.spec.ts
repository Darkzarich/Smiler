import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { fetchExternalImage } from '@libs/fetch-external-image';
import { ERRORS } from '@errors';

/** The guard runs at connect time, so the only way to show it works is to put
 * something reachable behind the address and watch the request never arrive.
 */
describe('fetchExternalImage SSRF guard', () => {
  let server: Server;
  let port: number;
  let received: string[];

  beforeAll(async () => {
    server = createServer((req, response) => {
      received.push(req.url ?? '');
      response.writeHead(200, { 'content-type': 'image/png' });
      response.end(Buffer.from('not reached'));
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });

    port = (server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await new Promise((resolve) => {
      server.close(resolve);
    });
  });

  beforeEach(() => {
    received = [];
  });

  it.each([
    ['loopback by IP', (p: number) => `http://127.0.0.1:${p}/picture.png`],
    ['loopback by name', (p: number) => `http://localhost:${p}/picture.png`],
    [
      'loopback by a name with a trailing dot',
      (p: number) => `http://localhost.:${p}/picture.png`,
    ],
    [
      'a name reserved for loopback',
      (p: number) => `http://anything.localhost:${p}/picture.png`,
    ],
    ['IPv6 loopback', (p: number) => `http://[::1]:${p}/picture.png`],
    [
      'loopback written as a decimal integer',
      (p: number) => `http://2130706433:${p}/picture.png`,
    ],
  ])('Should refuse to connect to %s', async (_label, buildUrl) => {
    await expect(fetchExternalImage(buildUrl(port))).rejects.toMatchObject({
      status: 422,
      message: ERRORS.EXTERNAL_IMAGE_URL_INVALID,
    });

    expect(received).toEqual([]);
  });

  it('Should refuse the cloud metadata endpoint', async () => {
    await expect(
      fetchExternalImage('http://169.254.169.254/latest/meta-data/picture.png'),
    ).rejects.toMatchObject({ message: ERRORS.EXTERNAL_IMAGE_URL_INVALID });
  });

  it('Should refuse a private address a public host redirects to', async () => {
    const redirector = createServer((_req, response) => {
      response.writeHead(302, {
        location: `http://127.0.0.1:${port}/picture.png`,
      });
      response.end();
    });

    await new Promise<void>((resolve) => {
      redirector.listen(0, '127.0.0.1', resolve);
    });

    const redirectorPort = (redirector.address() as AddressInfo).port;

    try {
      await expect(
        fetchExternalImage(`http://127.0.0.1:${redirectorPort}/picture.png`),
      ).rejects.toMatchObject({ message: ERRORS.EXTERNAL_IMAGE_URL_INVALID });

      expect(received).toEqual([]);
    } finally {
      await new Promise((resolve) => {
        redirector.close(resolve);
      });
    }
  });
});

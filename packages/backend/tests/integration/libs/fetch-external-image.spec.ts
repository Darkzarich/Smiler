import { createServer, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import Sharp from 'sharp';
import { POST_MAX_UPLOAD_IMAGE_SIZE } from '@constants/index';
import { ERRORS } from '@errors';

import * as privateHost from '@utils/is-private-host';
import { fetchExternalImage } from '@libs/fetch-external-image';

type Handler = (response: ServerResponse) => void;

const pngFixture = () =>
  Sharp({
    create: {
      width: 10,
      height: 10,
      channels: 3,
      background: { r: 0, g: 128, b: 255 },
    },
  })
    .png()
    .toBuffer();

describe('fetchExternalImage', () => {
  let server: Server;
  let origin: string;
  let handler: Handler;
  let requestedPaths: string[];

  beforeAll(async () => {
    // The downloader refuses to connect to a loopback address, and loopback is
    // the only address a test server can listen on. Standing the guard down
    // here leaves everything else — redirects, content types, the size cap —
    // running for real; the guard itself is covered by the sibling ssrf spec,
    // with nothing stubbed out.
    jest.spyOn(privateHost, 'isPrivateHost').mockReturnValue(false);
    jest.spyOn(privateHost, 'isPrivateIp').mockReturnValue(false);

    server = createServer((req, response) => {
      requestedPaths.push(req.url ?? '');
      handler(response);
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });

    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    jest.restoreAllMocks();

    await new Promise((resolve) => {
      server.close(resolve);
    });
  });

  beforeEach(() => {
    requestedPaths = [];
  });

  const respondWithImage = (body: Buffer) => (response: ServerResponse) => {
    response.writeHead(200, {
      'content-type': 'image/png',
      'content-length': body.length,
    });
    response.end(body);
  };

  it('Should download a picture and hand back its bytes untouched', async () => {
    const png = await pngFixture();

    handler = respondWithImage(png);

    const downloaded = await fetchExternalImage(`${origin}/picture.png`);

    expect(downloaded.equals(png)).toBe(true);
  });

  it('Should accept a url with no file extension at all', async () => {
    handler = respondWithImage(await pngFixture());

    await expect(
      fetchExternalImage(`${origin}/photo-1234?auto=format&w=800`),
    ).resolves.toBeInstanceOf(Buffer);
  });

  it('Should reject a protocol that is not http or https', async () => {
    await expect(
      fetchExternalImage('ftp://cdn.example.com/picture.jpg'),
    ).rejects.toMatchObject({
      status: 422,
      message: ERRORS.EXTERNAL_IMAGE_URL_INVALID,
    });

    await expect(
      fetchExternalImage('data:image/png;base64,abc'),
    ).rejects.toMatchObject({ message: ERRORS.EXTERNAL_IMAGE_URL_INVALID });
  });

  it('Should reject a url that carries credentials', async () => {
    await expect(
      fetchExternalImage('https://user:secret@cdn.example.com/picture.jpg'),
    ).rejects.toMatchObject({ message: ERRORS.EXTERNAL_IMAGE_URL_INVALID });
  });

  it('Should reject a url that is not a url', async () => {
    await expect(fetchExternalImage('not-a-url')).rejects.toMatchObject({
      message: ERRORS.EXTERNAL_IMAGE_URL_INVALID,
    });
  });

  it('Should reject a response that is not an image, whatever the path says', async () => {
    handler = (response) => {
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end('<html>not a picture</html>');
    };

    await expect(
      fetchExternalImage(`${origin}/picture.png`),
    ).rejects.toMatchObject({
      status: 422,
      message: ERRORS.EXTERNAL_IMAGE_NOT_AN_IMAGE,
    });
  });

  it('Should reject an svg, which is markup rather than a bitmap', async () => {
    handler = (response) => {
      response.writeHead(200, { 'content-type': 'image/svg+xml' });
      response.end('<svg xmlns="http://www.w3.org/2000/svg" />');
    };

    await expect(
      fetchExternalImage(`${origin}/picture.svg`),
    ).rejects.toMatchObject({ message: ERRORS.EXTERNAL_IMAGE_NOT_AN_IMAGE });
  });

  it('Should reject a response bigger than the upload limit', async () => {
    const tooBig = Buffer.alloc(POST_MAX_UPLOAD_IMAGE_SIZE + 1);

    handler = (response) => {
      response.writeHead(200, {
        'content-type': 'image/png',
        'content-length': tooBig.length,
      });
      response.end(tooBig);
    };

    await expect(
      fetchExternalImage(`${origin}/picture.png`),
    ).rejects.toMatchObject({
      status: 413,
      message: ERRORS.POST_MAX_UPLOAD_IMAGE_SIZE_EXCEEDED,
    });
  });

  it('Should stop reading a body that grows past the limit while it streams', async () => {
    // No content-length, so the only thing standing between the server and
    // memory is the running total kept while the body arrives.
    handler = (response) => {
      response.writeHead(200, { 'content-type': 'image/png' });

      const chunk = Buffer.alloc(256 * 1024);
      let written = 0;

      const writeChunk = () => {
        while (written <= POST_MAX_UPLOAD_IMAGE_SIZE * 2) {
          written += chunk.length;

          if (!response.write(chunk)) {
            response.once('drain', writeChunk);

            return;
          }
        }

        response.end();
      };

      writeChunk();
    };

    await expect(
      fetchExternalImage(`${origin}/picture.png`),
    ).rejects.toMatchObject({
      status: 413,
      message: ERRORS.POST_MAX_UPLOAD_IMAGE_SIZE_EXCEEDED,
    });
  });

  it('Should reject an empty body', async () => {
    handler = (response) => {
      response.writeHead(200, { 'content-type': 'image/png' });
      response.end();
    };

    await expect(
      fetchExternalImage(`${origin}/picture.png`),
    ).rejects.toMatchObject({ message: ERRORS.EXTERNAL_IMAGE_NOT_AN_IMAGE });
  });

  it('Should reject a response that is not a 200', async () => {
    handler = (response) => {
      response.writeHead(404, { 'content-type': 'text/plain' });
      response.end('gone');
    };

    await expect(
      fetchExternalImage(`${origin}/picture.png`),
    ).rejects.toMatchObject({
      status: 422,
      message: ERRORS.EXTERNAL_IMAGE_UNREACHABLE,
    });
  });

  it('Should follow a redirect to the picture', async () => {
    const png = await pngFixture();

    handler = (response) => {
      if (requestedPaths.length === 1) {
        response.writeHead(302, { location: '/real-picture.png' });
        response.end();

        return;
      }

      respondWithImage(png)(response);
    };

    const downloaded = await fetchExternalImage(`${origin}/picture.png`);

    expect(downloaded.equals(png)).toBe(true);
    expect(requestedPaths).toEqual(['/picture.png', '/real-picture.png']);
  });

  it('Should give up on a redirect loop instead of following it forever', async () => {
    handler = (response) => {
      response.writeHead(302, { location: '/picture.png' });
      response.end();
    };

    await expect(
      fetchExternalImage(`${origin}/picture.png`),
    ).rejects.toMatchObject({
      message: ERRORS.EXTERNAL_IMAGE_TOO_MANY_REDIRECTS,
    });

    expect(requestedPaths.length).toBeLessThanOrEqual(5);
  });

  it('Should reject a redirect that points at a protocol it would not have accepted', async () => {
    handler = (response) => {
      response.writeHead(302, {
        location: 'ftp://cdn.example.com/picture.jpg',
      });
      response.end();
    };

    await expect(
      fetchExternalImage(`${origin}/picture.png`),
    ).rejects.toMatchObject({ message: ERRORS.EXTERNAL_IMAGE_URL_INVALID });
  });

  it('Should report an unreachable host rather than leaking the socket error', async () => {
    await expect(
      fetchExternalImage('https://not-a-real-host.invalid/picture.jpg'),
    ).rejects.toMatchObject({
      status: 422,
      message: ERRORS.EXTERNAL_IMAGE_UNREACHABLE,
    });
  });
});

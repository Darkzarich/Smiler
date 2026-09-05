import { lookup as dnsLookup, type LookupAddress } from 'node:dns';
import { request as httpRequest, type IncomingMessage } from 'node:http';
import { request as httpsRequest } from 'node:https';
import type { LookupFunction } from 'node:net';
import {
  EXTERNAL_IMAGE_MAX_REDIRECTS,
  EXTERNAL_IMAGE_TIMEOUT,
  POST_MAX_UPLOAD_IMAGE_SIZE,
} from '@constants/index';
import {
  AbstractError,
  ValidationError,
  ContentTooLargeError,
  ERRORS,
} from '@errors';
import { logger } from '@libs/logger';
import {
  ALLOWED_URL_PROTOCOLS,
  isPrivateHost,
  isPrivateIp,
} from '@utils/is-private-host';

/** Content types the downloader will accept a response as. Deliberately the
 * same set the multipart upload accepts, minus anything Sharp cannot decode.
 */
const ALLOWED_IMAGE_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
]);

/** Resolves a hostname and refuses to hand back an address the server should
 * never connect to.
 *
 * Checking the hostname before the request is not enough on its own: a name is
 * free to resolve to a public address when it is validated and to a loopback
 * or metadata address a moment later, when the socket is actually opened. Node
 * calls this at connect time, so the address that gets checked is the address
 * that gets dialed, and there is no window in between. A name that resolves to
 * several addresses is rejected unless *every* one of them is public.
 */
const guardedLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) {
      callback(error, '', 0);

      return;
    }

    const resolved = addresses as LookupAddress[];
    const privateAddress = resolved.find(({ address }) => isPrivateIp(address));

    if (privateAddress) {
      logger.warn('external_image_private_address_blocked', {
        hostname,
        address: privateAddress.address,
      });

      // `lookup` is typed to fail with an errno, but the socket hands whatever
      // it is straight back to the request's error handler, which unwraps it.
      callback(
        new ValidationError(
          ERRORS.EXTERNAL_IMAGE_URL_INVALID,
        ) as NodeJS.ErrnoException,
        '',
        0,
      );

      return;
    }

    if (options.all) {
      callback(null, resolved as never, 0);

      return;
    }

    callback(null, resolved[0].address, resolved[0].family);
  });
};

/** Whether a url is shaped like something worth opening a socket for. What the
 * response actually contains is decided from its bytes, not from this.
 */
function parseAllowedUrl(urlString: string) {
  let url: URL;

  try {
    url = new URL(urlString);
  } catch {
    throw new ValidationError(ERRORS.EXTERNAL_IMAGE_URL_INVALID);
  }

  if (!ALLOWED_URL_PROTOCOLS.includes(url.protocol)) {
    throw new ValidationError(ERRORS.EXTERNAL_IMAGE_URL_INVALID);
  }

  // `guardedLookup` does not see this one: Node connects straight to a host
  // that is already an IP literal and never calls a lookup for it. The two
  // checks divide the work — this side rules out literals and names reserved
  // for the local network, the lookup rules out where a name resolves to.
  if (isPrivateHost(url.hostname)) {
    throw new ValidationError(ERRORS.EXTERNAL_IMAGE_URL_INVALID);
  }

  // Credentials in a url are never needed to reach a public picture and would
  // otherwise be forwarded to whatever host a redirect names.
  if (url.username || url.password) {
    throw new ValidationError(ERRORS.EXTERNAL_IMAGE_URL_INVALID);
  }

  return url;
}

function sendRequest(url: URL) {
  const request = url.protocol === 'https:' ? httpsRequest : httpRequest;

  return new Promise<IncomingMessage>((resolve, reject) => {
    const clientRequest = request(
      url,
      {
        method: 'GET',
        lookup: guardedLookup,
        timeout: EXTERNAL_IMAGE_TIMEOUT,
        headers: {
          accept: [...ALLOWED_IMAGE_CONTENT_TYPES].join(','),
        },
      },
      resolve,
    );

    clientRequest.on('timeout', () => {
      clientRequest.destroy(
        new ValidationError(ERRORS.EXTERNAL_IMAGE_UNREACHABLE),
      );
    });

    clientRequest.on('error', (error) => {
      // The guard rejects through this path too, and its verdict is the one
      // worth reporting. Everything else is a refused connection, a DNS miss
      // or a TLS failure — all of it the same thing to whoever pasted the url.
      if (error instanceof AbstractError) {
        reject(error);

        return;
      }

      logger.warn('external_image_request_failed', { host: url.host, error });

      reject(new ValidationError(ERRORS.EXTERNAL_IMAGE_UNREACHABLE));
    });

    clientRequest.end();
  });
}

/** Reads the body, giving up as soon as it goes past the size limit rather
 * than after the whole thing has landed in memory. `content-length` is only a
 * claim, so it is used to bail out early and never trusted as the real size.
 */
function readCappedBody(response: IncomingMessage) {
  const declaredLength = Number(response.headers['content-length']);

  if (declaredLength > POST_MAX_UPLOAD_IMAGE_SIZE) {
    response.destroy();

    throw new ContentTooLargeError(ERRORS.POST_MAX_UPLOAD_IMAGE_SIZE_EXCEEDED);
  }

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;

    response.on('data', (chunk: Buffer) => {
      size += chunk.length;

      if (size > POST_MAX_UPLOAD_IMAGE_SIZE) {
        response.destroy();

        reject(
          new ContentTooLargeError(ERRORS.POST_MAX_UPLOAD_IMAGE_SIZE_EXCEEDED),
        );

        return;
      }

      chunks.push(chunk);
    });

    response.on('error', reject);

    response.on('end', () => {
      if (!size) {
        reject(new ValidationError(ERRORS.EXTERNAL_IMAGE_NOT_AN_IMAGE));

        return;
      }

      resolve(Buffer.concat(chunks, size));
    });
  });
}

function resolveRedirect(response: IncomingMessage, from: URL) {
  const { location } = response.headers;

  response.resume();

  if (!location) {
    throw new ValidationError(ERRORS.EXTERNAL_IMAGE_UNREACHABLE);
  }

  // A relative Location is legal, and every hop is validated from scratch: a
  // public url is allowed to redirect to a private one, which is exactly the
  // hop an attacker would reach for.
  try {
    return parseAllowedUrl(new URL(location, from).toString());
  } catch {
    throw new ValidationError(ERRORS.EXTERNAL_IMAGE_URL_INVALID);
  }
}

/** Downloads a picture the user pointed at, so that it can be stored and served
 * from this origin instead of being hotlinked.
 *
 * Hotlinking hands the third party host a request — and so the IP address — of
 * every single viewer, and leaves the bytes under someone else's control long
 * after the post was written. Downloading also makes size an enforceable limit
 * rather than a promise the remote host never made.
 *
 * Returns the raw body. Deciding whether those bytes really are a picture is
 * left to whoever re-encodes them.
 */
export async function fetchExternalImage(urlString: string) {
  let url = parseAllowedUrl(urlString);

  for (let redirects = 0; redirects <= EXTERNAL_IMAGE_MAX_REDIRECTS; ) {
    // Each hop depends on the previous one's Location header, so these cannot
    // be issued in parallel.
    // eslint-disable-next-line no-await-in-loop
    const response = await sendRequest(url);
    const status = response.statusCode ?? 0;

    if (status >= 300 && status < 400) {
      url = resolveRedirect(response, url);
      redirects += 1;

      // eslint-disable-next-line no-continue
      continue;
    }

    if (status !== 200) {
      response.resume();

      throw new ValidationError(ERRORS.EXTERNAL_IMAGE_UNREACHABLE);
    }

    const contentType = (response.headers['content-type'] ?? '')
      .split(';')[0]
      .trim()
      .toLowerCase();

    if (!ALLOWED_IMAGE_CONTENT_TYPES.has(contentType)) {
      response.destroy();

      throw new ValidationError(ERRORS.EXTERNAL_IMAGE_NOT_AN_IMAGE);
    }

    return readCappedBody(response);
  }

  throw new ValidationError(ERRORS.EXTERNAL_IMAGE_TOO_MANY_REDIRECTS);
}

import {
  ALLOWED_VIDEO_EMBEDS,
  ALLOWED_VIDEO_EXTENSIONS,
} from '@constants/index';
import { ALLOWED_URL_PROTOCOLS, isPrivateHost } from '@utils/is-private-host';

/**
 * A video section points a reader's browser at this url, so it has to be a
 * public http(s) address that is either a video file or one of the embed hosts
 * the frontend knows how to render.
 */
export function isValidVideoUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    if (!ALLOWED_URL_PROTOCOLS.includes(url.protocol)) {
      return false;
    }

    if (isPrivateHost(url.hostname)) {
      return false;
    }

    if (ALLOWED_VIDEO_EMBEDS.includes(url.hostname.replace(/^(www|m)\./, ''))) {
      return true;
    }

    const fileName = url.pathname.split('/').pop() ?? '';
    const extension = fileName.includes('.')
      ? fileName.split('.').pop()!.toLowerCase()
      : '';

    return ALLOWED_VIDEO_EXTENSIONS.includes(extension);
  } catch {
    return false;
  }
}

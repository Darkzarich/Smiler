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

    const extension = url.pathname.split('.').pop()?.toLowerCase();

    if (extension && ALLOWED_VIDEO_EXTENSIONS.includes(extension)) {
      return true;
    }

    return ALLOWED_VIDEO_EMBEDS.includes(url.hostname);
  } catch {
    return false;
  }
}

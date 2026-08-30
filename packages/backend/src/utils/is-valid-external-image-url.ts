import { ALLOWED_PICTURE_EXTENSIONS } from '@constants/index';
import { ALLOWED_URL_PROTOCOLS, isPrivateHost } from '@utils/is-private-host';

export function isValidExternalImageUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (!ALLOWED_URL_PROTOCOLS.includes(url.protocol)) return false;

    if (isPrivateHost(url.hostname)) return false;

    const { pathname } = url;
    const ext = pathname.split('.').pop()?.toLowerCase();

    if (!ext) return false;

    return ALLOWED_PICTURE_EXTENSIONS.includes(ext);
  } catch {
    return false;
  }
}

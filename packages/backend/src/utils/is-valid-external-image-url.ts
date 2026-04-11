import { ALLOWED_PICTURE_EXTENSIONS } from '@constants/index';

const LOCAL_HOST_NAMES = ['localhost', '127.0.0.1', '::1', '[::1]'];
const PROTOCOLS = ['http:', 'https:'];
const PRIVATE_IP_REGEXP = /^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\.|^192\.168\./;

export function isValidExternalImageUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (!PROTOCOLS.includes(url.protocol)) return false;

    const { hostname } = url;
    if (LOCAL_HOST_NAMES.includes(hostname)) return false;
    if (PRIVATE_IP_REGEXP.test(hostname)) return false;

    const { pathname } = url;
    const ext = pathname.split('.').pop()?.toLowerCase();

    if (!ext) return false;

    return ALLOWED_PICTURE_EXTENSIONS.includes(ext);
  } catch {
    return false;
  }
}

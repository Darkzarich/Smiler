import config from '@/config/config';

/** Picture sections hold either an absolute third party URL — how pictures were
 * stored before the backend started downloading them — or a path under the
 * API's `/uploads` folder, which only becomes fetchable once the API origin is
 * prepended.
 */
export function resolveImage(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return config.VUE_APP_API_URL + path;
}

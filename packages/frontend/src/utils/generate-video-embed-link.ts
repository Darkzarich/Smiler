import * as consts from '@/const';

export function generateVideoEmbedLink(url: string): string {
  try {
    const youtubeRegExp = consts.POST_SECTION_VIDEO_REGEXP.YOUTUBE;
    const matchedURL = url.match(youtubeRegExp);

    if (matchedURL) {
      if (matchedURL.length > 0 && (matchedURL[6] || matchedURL[8])) {
        return `${consts.POST_SECTION_VIDEO_EMBED.YOUTUBE}${matchedURL[6] || matchedURL[8]}`;
      }
    }

    const isOtherVideoService =
      consts.POST_SECTION_VIDEO_REGEXP.OTHERS.test(url);

    if (isOtherVideoService) {
      return url;
    }

    return 'error';
  } catch {
    return 'error';
  }
}

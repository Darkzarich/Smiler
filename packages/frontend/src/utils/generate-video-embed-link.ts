import consts from '@/const/const';

export function generateVideoEmbedLink(url: string): string {
  try {
    const youtubeRegExp = consts.POST_SECTION_VIDEO_REGEXP.YOUTUBE;
    let matchedURL = url.match(youtubeRegExp);

    if (matchedURL) {
      if (matchedURL.length > 0 && (matchedURL[6] || matchedURL[8])) {
        return `${consts.POST_SECTION_VIDEO_EMBED.YOUTUBE}${matchedURL[6] || matchedURL[8]}`;
      }
    }

    matchedURL = consts.POST_SECTION_VIDEO_REGEXP.OTHERS.test(url);

    if (matchedURL) {
      return url;
    }

    return 'error';
  } catch (e) {
    return 'error';
  }
}

/** What browsers play in a <video> element. The backend accepts the same list
 * (`ALLOWED_VIDEO_EXTENSIONS`), so keep the two in step. */
export const VIDEO_FILE_EXTENSIONS = [
  'mp4',
  'm4v',
  'webm',
  'ogv',
  'ogg',
  'mov',
];

/** Common video files no browser plays, worth naming in the error */
export const UNPLAYABLE_VIDEO_EXTENSIONS = ['avi', 'wmv', 'flv'];

export type VideoSource =
  | { kind: 'file'; src: string }
  | {
      kind: 'embed';
      provider: string;
      src: string;
      isPortrait: boolean;
    };

type Embed = { src: string; isPortrait?: boolean } | null;

interface Provider {
  name: string;
  /** Without `www.` or `m.`, which are stripped before matching. The backend
   * accepts the same hosts (`ALLOWED_VIDEO_EMBEDS`). */
  hosts: string[];
  embed: (url: URL, segments: string[], parent: string) => Embed;
}

// Followed by anything but an id character, so that the `&t=497s` once glued to
// an embed path by the old editor does not hide the id
const YOUTUBE_ID = /^[\w-]{11}(?![\w-])/;
const DIGITS = /^\d+$/;
const HEX = /^[\da-f]+$/i;
const SLUG = /^[\w-]+$/;

/** `90`, `90s`, `1m30s` or `1h2m3s` in seconds; 0 for anything else */
function parseStartTime(value: string | null) {
  const match = value?.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);

  if (!match) {
    return 0;
  }

  const [, hours = 0, minutes = 0, seconds = 0] = match;

  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

const providers: Provider[] = [
  {
    name: 'YouTube',
    hosts: ['youtube.com', 'youtube-nocookie.com', 'youtu.be'],
    embed(url, [first, second]) {
      let id: string | null | undefined;

      if (url.hostname === 'youtu.be') {
        id = first;
      } else if (first === 'watch') {
        id = url.searchParams.get('v');
      } else if (['embed', 'shorts', 'live', 'v'].includes(first)) {
        id = second;
      }

      const match = id?.match(YOUTUBE_ID);

      if (!match) {
        return null;
      }

      const start = parseStartTime(
        url.searchParams.get('t') ?? url.searchParams.get('start'),
      );

      return {
        src: `https://www.youtube.com/embed/${match[0]}${start ? `?start=${start}` : ''}`,
        isPortrait: first === 'shorts',
      };
    },
  },
  {
    name: 'Vimeo',
    hosts: ['vimeo.com', 'player.vimeo.com'],
    embed(url, segments) {
      const index = segments.findIndex((segment) => DIGITS.test(segment));

      if (index === -1) {
        return null;
      }

      // An unlisted video carries a hash, in the path or as `h`
      const hash = segments[index + 1] ?? url.searchParams.get('h');

      return {
        src: `https://player.vimeo.com/video/${segments[index]}${hash && HEX.test(hash) ? `?h=${hash}` : ''}`,
      };
    },
  },
  {
    name: 'Twitch',
    hosts: ['twitch.tv', 'clips.twitch.tv', 'player.twitch.tv'],
    embed(url, segments, parent) {
      // Twitch refuses to play in a page whose host is not named as `parent`,
      // and starts playing on load unless told not to
      const options = `parent=${encodeURIComponent(parent)}&autoplay=false`;

      let clip: string | null | undefined;
      let video: string | null | undefined;

      if (url.hostname === 'clips.twitch.tv') {
        clip =
          segments[0] === 'embed' ? url.searchParams.get('clip') : segments[0];
      } else if (url.hostname === 'player.twitch.tv') {
        video = url.searchParams.get('video')?.replace(/^v/, '');
      } else if (segments[0] === 'videos') {
        video = segments[1];
      } else if (segments[1] === 'clip') {
        clip = segments[2];
      }

      if (clip && SLUG.test(clip)) {
        return { src: `https://clips.twitch.tv/embed?clip=${clip}&${options}` };
      }

      if (video && DIGITS.test(video)) {
        return { src: `https://player.twitch.tv/?video=v${video}&${options}` };
      }

      return null;
    },
  },
  {
    name: 'Streamable',
    hosts: ['streamable.com'],
    embed(_url, segments) {
      const id = ['e', 'o'].includes(segments[0]) ? segments[1] : segments[0];

      if (!id || !/^[\da-z]+$/i.test(id)) {
        return null;
      }

      return { src: `https://streamable.com/e/${id}` };
    },
  },
  {
    name: 'Rutube',
    hosts: ['rutube.ru'],
    embed(_url, segments) {
      const id = segments.find((segment) => /^[\da-f]{32}$/i.test(segment));

      if (!id) {
        return null;
      }

      return {
        src: `https://rutube.ru/play/embed/${id}`,
        isPortrait: segments[0] === 'shorts',
      };
    },
  },
  {
    name: 'VK Video',
    hosts: ['vk.com', 'vk.ru', 'vkvideo.ru'],
    embed(url, segments) {
      let kind: string | undefined;
      let ownerId: string | null | undefined;
      let videoId: string | null | undefined;

      if (segments[0] === 'video_ext.php') {
        ownerId = url.searchParams.get('oid');
        videoId = url.searchParams.get('id');
      } else {
        // `/video-1_2` and `/clip-1_2`, or a video opened over a feed: `?z=video-1_2`
        const match = [segments.at(-1), url.searchParams.get('z')]
          .map((part) => part?.match(/^(video|clip)(-?\d+)_(\d+)/))
          .find(Boolean);

        [, kind, ownerId, videoId] = match ?? [];
      }

      if (
        !ownerId ||
        !/^-?\d+$/.test(ownerId) ||
        !videoId ||
        !DIGITS.test(videoId)
      ) {
        return null;
      }

      const hash = url.searchParams.get('hash');

      return {
        src: `https://vkvideo.ru/video_ext.php?oid=${ownerId}&id=${videoId}${hash && HEX.test(hash) ? `&hash=${hash}` : ''}`,
        isPortrait: kind === 'clip',
      };
    },
  },
];

export const VIDEO_PROVIDER_NAMES = providers.map(({ name }) => name);

export function getUrlExtension(url: URL) {
  const name = url.pathname.split('/').pop() ?? '';

  return name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
}

/**
 * Turns the link an author pasted into what a post plays: a provider's player
 * page for an `<iframe>`, or a file for a `<video>`.
 *
 * The player's address is always built here from the id, never taken from the
 * link, so a section can only ever frame one of these providers.
 *
 * @param parent the host the player is shown on, which Twitch asks for
 */
export function parseVideoUrl(
  value: string,
  parent = window.location.hostname,
): VideoSource | null {
  let url: URL;

  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    return null;
  }

  const host = url.hostname.replace(/^(www|m)\./, '');
  const provider = providers.find((candidate) =>
    candidate.hosts.includes(host),
  );

  if (provider) {
    url.hostname = host;

    const segments = url.pathname.split('/').filter(Boolean);
    const embed = provider.embed(url, segments, parent);

    return embed
      ? {
          kind: 'embed',
          provider: provider.name,
          src: embed.src,
          isPortrait: Boolean(embed.isPortrait),
        }
      : null;
  }

  if (VIDEO_FILE_EXTENSIONS.includes(getUrlExtension(url))) {
    return { kind: 'file', src: url.href };
  }

  return null;
}

import { describe, it, expect } from 'vitest';
import { parseVideoUrl } from './parse-video-url';

const embedOf = (url: string) => {
  const source = parseVideoUrl(url, 'smiler.example');

  return source?.kind === 'embed' ? source.src : source;
};

describe('parseVideoUrl', () => {
  it.each([
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com/watch?feature=share&v=dQw4w9WgXcQ',
    'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ?si=abc',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://www.youtube.com/live/dQw4w9WgXcQ',
    'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    '  https://www.youtube.com/watch?v=dQw4w9WgXcQ  ',
  ])('embeds the YouTube link %s', (url) => {
    expect(parseVideoUrl(url)).toEqual({
      kind: 'embed',
      provider: 'YouTube',
      src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      isPortrait: false,
    });
  });

  it('plays a YouTube short in portrait', () => {
    expect(
      parseVideoUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ'),
    ).toMatchObject({
      src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      isPortrait: true,
    });
  });

  it.each([
    ['https://youtu.be/dQw4w9WgXcQ?t=90', 90],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s', 90],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1h0m5s', 3605],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ?start=42', 42],
  ])('starts %s at %i seconds', (url, start) => {
    expect(embedOf(url)).toBe(
      `https://www.youtube.com/embed/dQw4w9WgXcQ?start=${start}`,
    );
  });

  it('reads the id of an embed link with its query glued to the path', () => {
    expect(embedOf('https://www.youtube.com/embed/e4iYCvT8xSE&t=497s')).toBe(
      'https://www.youtube.com/embed/e4iYCvT8xSE',
    );
  });

  it.each([
    ['https://vimeo.com/76979871', 'https://player.vimeo.com/video/76979871'],
    [
      'https://vimeo.com/channels/staffpicks/76979871',
      'https://player.vimeo.com/video/76979871',
    ],
    [
      'https://vimeo.com/76979871/3e5a7b9c1d',
      'https://player.vimeo.com/video/76979871?h=3e5a7b9c1d',
    ],
    [
      'https://player.vimeo.com/video/76979871?h=3e5a7b9c1d',
      'https://player.vimeo.com/video/76979871?h=3e5a7b9c1d',
    ],
    [
      'https://www.twitch.tv/videos/2041234567',
      'https://player.twitch.tv/?video=v2041234567&parent=smiler.example&autoplay=false',
    ],
    [
      'https://www.twitch.tv/somechannel/clip/FunnyClip-AbC_12',
      'https://clips.twitch.tv/embed?clip=FunnyClip-AbC_12&parent=smiler.example&autoplay=false',
    ],
    [
      'https://clips.twitch.tv/FunnyClip-AbC_12',
      'https://clips.twitch.tv/embed?clip=FunnyClip-AbC_12&parent=smiler.example&autoplay=false',
    ],
    ['https://streamable.com/moo12', 'https://streamable.com/e/moo12'],
    ['https://streamable.com/e/moo12', 'https://streamable.com/e/moo12'],
    [
      'https://rutube.ru/video/c6cc4d620b1d4338901770a44b3e82f4/',
      'https://rutube.ru/play/embed/c6cc4d620b1d4338901770a44b3e82f4',
    ],
    [
      'https://vk.com/video-22822305_456241864',
      'https://vkvideo.ru/video_ext.php?oid=-22822305&id=456241864',
    ],
    [
      'https://vkvideo.ru/video-22822305_456241864',
      'https://vkvideo.ru/video_ext.php?oid=-22822305&id=456241864',
    ],
    [
      'https://vk.com/feed?z=video-22822305_456241864%2Fpl_cat_trends',
      'https://vkvideo.ru/video_ext.php?oid=-22822305&id=456241864',
    ],
    [
      'https://vk.com/video_ext.php?oid=-22822305&id=456241864&hash=8f3a',
      'https://vkvideo.ru/video_ext.php?oid=-22822305&id=456241864&hash=8f3a',
    ],
  ])('embeds %s as %s', (url, src) => {
    expect(embedOf(url)).toBe(src);
  });

  it.each([
    'https://example.com/clips/cat.mp4',
    'https://example.com/clips/cat.WEBM?token=1',
    'http://example.com/clip.mov',
    'https://example.com/clip.m4v',
    'https://example.com/clip.ogv',
  ])('plays the file %s in a video element', (url) => {
    expect(parseVideoUrl(url)).toEqual({ kind: 'file', src: url });
  });

  it.each([
    '',
    'error',
    'not a url',
    'javascript:alert(1)//.mp4',
    'ftp://example.com/clip.mp4',
    'https://example.com/clip.avi',
    'https://example.com/clip.mp4.html',
    'https://example.com/page',
    'https://www.youtube.com/',
    'https://www.youtube.com/watch?v=short',
    'https://www.youtube.com/@somechannel',
    'https://vimeo.com/about',
    'https://www.dailymotion.com/video/x8ab4ui',
    'https://www.twitch.tv/somechannel',
    'https://rutube.ru/channel/123/',
    'https://vk.com/somegroup',
    'https://www.youtube.com/clip.mp4',
  ])('does not play %s', (url) => {
    expect(parseVideoUrl(url)).toBeNull();
  });
});

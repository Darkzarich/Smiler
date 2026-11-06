import { isValidVideoUrl } from '@utils/is-valid-video-url';

describe('isValidVideoUrl', () => {
  it.each([
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://vimeo.com/76979871',
    'https://player.vimeo.com/video/76979871',
    'https://www.twitch.tv/videos/2041234567',
    'https://clips.twitch.tv/FunnyClip',
    'https://streamable.com/moo12',
    'https://rutube.ru/video/c6cc4d620b1d4338901770a44b3e82f4/',
    'https://vk.com/video-22822305_456241864',
    'https://vkvideo.ru/video-22822305_456241864',
    'https://example.com/clips/cat.mp4',
    'https://example.com/clips/cat.WEBM?token=1',
    'http://example.com/clip.mov',
    'https://example.com/clip.ogv',
    'https://example.com/clip.m4v',
  ])('accepts %s', (url) => {
    expect(isValidVideoUrl(url)).toBe(true);
  });

  it.each([
    'error',
    'ftp://example.com/clip.mp4',
    'https://example.com/clip.avi',
    'https://example.com/clip.mp4.html',
    'https://example.com/video',
    'https://www.dailymotion.com/video/x8ab4ui',
    'https://example.com/v1.2/video',
    'https://notyoutube.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com.example.com/watch?v=dQw4w9WgXcQ',
    'http://localhost/clip.mp4',
    'http://192.168.0.1/clip.mp4',
  ])('rejects %s', (url) => {
    expect(isValidVideoUrl(url)).toBe(false);
  });
});

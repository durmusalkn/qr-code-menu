import { isSafeRelPath, mediaDayDir, mediaRelPath, thumbnailRelPath } from '@/lib/paths';

// Tests run with TZ=Europe/Istanbul (UTC+3), see jest.config.js.
const OCT_15_2026_0900_LOCAL = Date.UTC(2026, 9, 15, 6, 0);
const OCT_16_2026_0030_LOCAL = Date.UTC(2026, 9, 15, 21, 30);

describe('paths', () => {
  it('groups media by local calendar day', () => {
    expect(mediaDayDir(OCT_15_2026_0900_LOCAL)).toBe('media/2026/10/15');
    // 21:30 UTC is already the next day in Istanbul.
    expect(mediaDayDir(OCT_16_2026_0030_LOCAL)).toBe('media/2026/10/16');
  });

  it('builds relative media paths', () => {
    expect(mediaRelPath(OCT_15_2026_0900_LOCAL, 'abc', 'JPG')).toBe('media/2026/10/15/abc.jpg');
    expect(mediaRelPath(OCT_15_2026_0900_LOCAL, 'abc', '.m4a')).toBe('media/2026/10/15/abc.m4a');
    expect(thumbnailRelPath(OCT_15_2026_0900_LOCAL, 'abc')).toBe('media/2026/10/15/abc.thumb.jpg');
  });

  it('rejects odd extensions', () => {
    expect(() => mediaRelPath(0, 'abc', 'jp g')).toThrow();
    expect(() => mediaRelPath(0, 'abc', '')).toThrow();
  });

  it.each(['media/2026/10/15/a.jpg', 'db/anilar.db'])('accepts %p', (p) => {
    expect(isSafeRelPath(p)).toBe(true);
  });

  it.each(['', '/etc/passwd', '../x', 'media/../../x', 'media//x', 'media\\x', './x'])(
    'rejects %p',
    (p) => {
      expect(isSafeRelPath(p)).toBe(false);
    },
  );
});

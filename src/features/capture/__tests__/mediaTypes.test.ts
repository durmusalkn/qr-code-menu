import { describeMediaFile } from '@/features/capture/mediaTypes';

describe('describeMediaFile', () => {
  it('maps known mime types', () => {
    expect(describeMediaFile('photo', 'file:///c/x', 'image/jpeg')).toEqual({
      mimeType: 'image/jpeg',
      extension: 'jpg',
    });
    expect(describeMediaFile('video', 'file:///c/x', 'video/mp4').extension).toBe('mp4');
  });

  it('falls back to the file extension for unknown mime types', () => {
    expect(describeMediaFile('video', 'file:///c/clip.MKV', 'video/x-matroska')).toEqual({
      mimeType: 'video/x-matroska',
      extension: 'mkv',
    });
  });

  it('uses per-kind defaults when nothing is known', () => {
    expect(describeMediaFile('audio', 'file:///c/recording', null)).toEqual({
      mimeType: 'audio/mp4',
      extension: 'm4a',
    });
    expect(describeMediaFile('photo', 'file:///c/x')).toEqual({
      mimeType: 'image/jpeg',
      extension: 'jpg',
    });
  });
});

import { parseCaptureOrigin } from '@/features/capture/origin';

describe('parseCaptureOrigin', () => {
  it('defaults to an in-app capture', () => {
    expect(parseCaptureOrigin({})).toEqual({ source: 'in_app', promptId: null });
  });

  it('keeps the prompt id for prompt captures', () => {
    expect(parseCaptureOrigin({ source: 'prompt', promptId: 'p1' })).toEqual({
      source: 'prompt',
      promptId: 'p1',
    });
  });

  it('ignores prompt ids for other sources and unknown sources', () => {
    expect(parseCaptureOrigin({ source: 'quick_capture', promptId: 'p1' })).toEqual({
      source: 'quick_capture',
      promptId: null,
    });
    expect(parseCaptureOrigin({ source: 'hack', promptId: 'p1' })).toEqual({
      source: 'in_app',
      promptId: null,
    });
  });

  it('accepts array params', () => {
    expect(parseCaptureOrigin({ source: ['prompt', 'x'], promptId: ['p2'] })).toEqual({
      source: 'prompt',
      promptId: 'p2',
    });
  });
});

import { withTimeout } from '@/lib/async';

describe('withTimeout', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('passes the value through when it arrives in time', async () => {
    await expect(withTimeout(Promise.resolve(42), 1000)).resolves.toBe(42);
  });

  it('gives null when the promise rejects', async () => {
    await expect(withTimeout(Promise.reject(new Error('x')), 1000)).resolves.toBeNull();
  });

  it('gives null after the timeout', async () => {
    const never = new Promise<number>(() => {});
    const result = withTimeout(never, 1000);
    jest.advanceTimersByTime(1000);
    await expect(result).resolves.toBeNull();
  });
});

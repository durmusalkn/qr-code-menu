import { tr } from '@/i18n/tr';

function collectStrings(node: unknown, path: string, out: [string, string][]): void {
  if (typeof node === 'string') {
    out.push([path, node]);
    return;
  }
  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      collectStrings(value, path ? `${path}.${key}` : key, out);
    }
  }
}

describe('tr', () => {
  it('has no empty strings', () => {
    const strings: [string, string][] = [];
    collectStrings(tr, '', strings);

    expect(strings.length).toBeGreaterThan(0);
    for (const [path, value] of strings) {
      expect({ path, empty: value.trim() === '' }).toEqual({ path, empty: false });
    }
  });
});

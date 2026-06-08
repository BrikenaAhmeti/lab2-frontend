import { describe, expect, it } from 'vitest';
import { safeHref, safeImageSrc } from '@/utils/safeUrl';

describe('safe URL helpers', () => {
  it('allows safe internal and http links', () => {
    expect(safeHref('/services')).toBe('/services');
    expect(safeHref('#contact')).toBe('#contact');
    expect(safeHref('https://example.com/path')).toBe('https://example.com/path');
  });

  it('blocks scriptable links and protocol-relative assets', () => {
    expect(safeHref('javascript:alert(1)')).toBeNull();
    expect(safeImageSrc('//evil.example/image.png')).toBeNull();
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePosterUrl } from './poster-normalizer.js';

describe('poster-normalizer', () => {
  it('returns full TMDB image URL for poster paths', () => {
    assert.strictEqual(normalizePosterUrl('/l8g0K2RaZTJEZlmluBl7Fp659Li.jpg'), 'https://image.tmdb.org/t/p/w500/l8g0K2RaZTJEZlmluBl7Fp659Li.jpg');
  });

  it('returns null for missing poster strings', () => {
    assert.strictEqual(normalizePosterUrl('null'), null);
    assert.strictEqual(normalizePosterUrl(''), null);
    assert.strictEqual(normalizePosterUrl('   '), null);
  });

  it('returns null for invalid remote hosts', () => {
    assert.strictEqual(normalizePosterUrl('https://example.com/poster.jpg'), null);
  });
});

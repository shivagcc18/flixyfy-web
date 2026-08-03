import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getYearOptions, isYearValidForDomain, getYearRange } from './search-helpers.js';

describe('search-helpers', () => {
  it('returns years 2000 through current for current domain', () => {
    const currentYear = new Date().getFullYear();
    const yearOptions = getYearOptions('current');
    assert.strictEqual(yearOptions[0].value, '');
    assert.strictEqual(yearOptions[1].value, String(currentYear));
    assert.strictEqual(yearOptions[yearOptions.length - 1].value, '2000');
  });

  it('returns years 1960 through 1999 for historical domain', () => {
    const yearOptions = getYearOptions('historical');
    assert.strictEqual(yearOptions[0].value, '');
    assert.strictEqual(yearOptions[1].value, '1999');
    assert.strictEqual(yearOptions[yearOptions.length - 1].value, '1960');
  });

  it('validates current domain years correctly', () => {
    const currentYear = new Date().getFullYear();
    assert.ok(isYearValidForDomain(String(currentYear), 'current'));
    assert.ok(isYearValidForDomain('2000', 'current'));
    assert.ok(!isYearValidForDomain('1999', 'current'));
    assert.ok(!isYearValidForDomain('1960', 'current'));
    assert.ok(!isYearValidForDomain('abcd', 'current'));
  });

  it('validates historical domain years correctly', () => {
    assert.ok(isYearValidForDomain('1999', 'historical'));
    assert.ok(isYearValidForDomain('1960', 'historical'));
    assert.ok(!isYearValidForDomain('2000', 'historical'));
    assert.ok(!isYearValidForDomain('1959', 'historical'));
  });

  it('returns expected year ranges', () => {
    const currentYear = new Date().getFullYear();
    assert.deepStrictEqual(getYearRange('current'), { min: 2000, max: currentYear });
    assert.deepStrictEqual(getYearRange('historical'), { min: 1960, max: 1999 });
  });
});

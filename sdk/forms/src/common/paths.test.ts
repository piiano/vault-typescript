import { describe, expect, test } from 'vitest';
import { followPath } from './paths';

describe('followPath function', () => {
  test(`Doesn't cause prototype pollution`, () => {
    const maliciousObject = JSON.parse('{"a": {"__proto__": {"polluted": true}}}');
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    followPath(maliciousObject, 'a.__proto__');

    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  const testCases: ({ name: string; params: { value: unknown; path?: string } } & (
    | { error: true }
    | { output: unknown }
  ))[] = [
    {
      name: 'Access primitive value without path',
      params: { value: 42 },
      output: 42,
    },
    {
      name: 'Access primitive value with empty path',
      params: { value: 42, path: '' },
      error: true,
    },
    {
      name: 'Access primitive value with path',
      params: { value: 42, path: 'a' },
      error: true,
    },
    {
      name: 'Access primitive value with dot path',
      params: { value: 42, path: '.' },
      error: true,
    },
    {
      name: 'Access object value without path',
      params: { value: { foo: 42 } },
      output: { foo: 42 },
    },
    {
      name: 'Access object value with empty path',
      params: { value: { foo: 42 }, path: '' },
      error: true,
    },
    {
      name: 'Access array value without path',
      params: { value: [42] },
      output: [42],
    },
    {
      name: 'Access array value with empty path',
      params: { value: [42], path: '' },
      error: true,
    },
    {
      name: 'Access object property',
      params: { value: { a: 1, b: 2 }, path: 'a' },
      output: 1,
    },
    {
      name: 'Access object property 2',
      params: { value: { a: 1, b: 2 }, path: 'b' },
      output: 2,
    },
    {
      name: 'Access nested property',
      params: { value: { a: { b: { c: 1, d: 2 } } }, path: 'a.b.d' },
      output: 2,
    },
    {
      name: 'Access non-existent property',
      params: { value: { a: { b: 1 } }, path: 'a.c' },
      error: true,
    },
    {
      name: 'Access array elements',
      params: { value: [10, 20, 30], path: '[1]' },
      output: 20,
    },
    {
      name: 'Access nested array element',
      params: { value: { a: [{ b: 42 }, { c: ['foo', 'bar'] }] }, path: 'a[1].c[0]' },
      output: 'foo',
    },
    {
      name: 'Access property with brackets in key',
      params: { value: { '[a]': 10 }, path: '["[a]"]' },
      output: 10,
    },
    {
      name: 'Access property with special characters',
      params: { value: { 'key with spaces': { '@!$': 42 } }, path: '["key with spaces"]["@!$"]' },
      output: 42,
    },
    {
      name: 'Non-existent property',
      params: { value: { a: 1 }, path: 'b' },
      error: true,
    },
    {
      name: 'Non-existent array index',
      params: { value: [1, 2, 3], path: '[3]' },
      error: true,
    },
    {
      name: 'Array index starts with zero',
      params: { value: ['foo', 42, {}], path: '[0]' },
      output: 'foo',
    },
    {
      name: 'Access property on non-object',
      params: { value: 42, path: 'a' },
      error: true,
    },
    {
      name: 'Access method on primitive',
      params: { value: 42, path: 'toString' },
      error: true,
    },
    {
      name: 'Access method on object',
      params: { value: { a: 42 }, path: 'toString' },
      error: true,
    },
    {
      name: 'Access method on array',
      params: { value: [42], path: 'toString' },
      error: true,
    },
    {
      name: 'Access length property on array',
      params: { value: [10, 20, 30], path: 'length' },
      error: true,
    },
    {
      name: 'Null value with non-empty path',
      params: { value: null, path: 'a' },
      error: true,
    },
    {
      name: 'Null value without path',
      params: { value: null },
      output: null,
    },
    {
      name: 'Access object key with dot in key',
      params: { value: { 'a.b': 10 }, path: '["a.b"]' },
      output: 10,
    },
    {
      name: 'Access object key with dot in key using dot notation',
      params: { value: { 'a.b': 10 }, path: 'a.b' },
      error: true,
    },
    {
      name: 'Access object key with dot in key without quotes',
      params: { value: { 'a.b': 10 }, path: '[a.b]' },
      error: true,
    },
    {
      name: 'Access object key with dot and quotes in key',
      params: { value: { 'a."b': 10 }, path: '["a.\\"b"]' },
      output: 10,
    },
    {
      name: 'Access object key with dot and unescaped quotes in key',
      params: { value: { 'a."b': 10 }, path: '["a."b"]' },
      error: true,
    },
    {
      name: 'Access nested property with quoted keys',
      params: { value: { 'a.b': { 'c.d': [{ foo: 10 }] } }, path: '["a.b"]["c.d"][0].foo' },
      output: 10,
    },
    {
      name: 'Access nested property with quoted keys using single quotes in path',
      params: { value: { 'a.b': { 'c.d': [{ foo: 10 }] } }, path: `['a.b']['c.d'][0].foo` },
      output: 10,
    },
    {
      name: 'Access nested property with quoted keys using mixed valid quotes in path',
      params: { value: { 'a.b': { 'c.d': [{ foo: 10 }] } }, path: `["a.b"]['c.d'][0].foo` },
      output: 10,
    },
    {
      name: 'Access property with single quotes in key',
      params: { value: { "key's": 15 }, path: `["key's"]` },
      output: 15,
    },
    {
      name: 'Access property with double quotes in key',
      params: { value: { 'key"double"quotes': 25 }, path: `["key\\"double\\"quotes"]` },
      output: 25,
    },
    {
      name: 'Access property with unicode characters',
      params: { value: { '🦄': 100 }, path: '["🦄"]' },
      output: 100,
    },
    {
      name: 'Access property with unicode characters using dot notation',
      params: { value: { '🦄': 100 }, path: '🦄' },
      error: true,
    },
    {
      name: 'Access object property with numeric characters using dot notation',
      params: { value: { '2': 100 }, path: '2' },
      error: true,
    },
    {
      name: 'Invalid path syntax (double dot)',
      params: { value: { a: { b: 1 } }, path: 'a..b' },
      error: true,
    },
    {
      name: 'Invalid array index (negative number)',
      params: { value: [1, 2, 3], path: '[-1]' },
      error: true,
    },
    {
      name: 'Invalid array index (non-integer)',
      params: { value: [1, 2, 3], path: '[1.5]' },
      error: true,
    },
    {
      name: 'Access array with quoted index',
      params: { value: ['foo', 'bar'], path: '["0"]' },
      error: true,
    },
    {
      name: 'Access object with numeric key',
      params: { value: { a: { 10: 'foo' } }, path: 'a.10' },
      error: true,
    },
    {
      name: 'Access object with numeric key using bracket notation',
      params: { value: { a: { 10: 'foo' } }, path: 'a["10"]' },
      output: 'foo',
    },
    {
      name: 'Access object with numeric key using unquoted bracket notation',
      params: { value: { a: { 10: 'foo' } }, path: 'a[10]' },
      error: true,
    },
    {
      name: 'Access deeply nested property',
      params: { value: { a: { b: { c: { d: { e: 100 } } } } }, path: 'a.b.c.d.e' },
      output: 100,
    },
    {
      name: 'Path with trailing dot',
      params: { value: { a: { b: 2 } }, path: 'a.b.' },
      error: true,
    },
    {
      name: 'Path with leading dot',
      params: { value: { a: { b: 2 } }, path: '.a.b' },
      error: true,
    },
    {
      name: 'Path with spaces',
      params: { value: { 'a b': { 'c d': 5 } }, path: '["a b"]["c d"]' },
      output: 5,
    },
    {
      name: 'Access property with backslash in key',
      params: { value: { 'a\\b': 7 }, path: '["a\\\\b"]' },
      output: 7,
    },
    {
      name: 'Access owned __proto__ property',
      params: { value: { ['__proto__']: 'foo' }, path: '__proto__' },
      output: 'foo',
    },
    {
      name: 'Access owned constructor.prototype property',
      params: { value: { constructor: { prototype: 'foo' } }, path: 'constructor.prototype' },
      output: 'foo',
    },
    {
      name: 'Attempt to access not owned __proto__ property',
      params: { value: { foo: 'test' }, path: '__proto__' },
      error: true,
    },
    {
      name: 'Attempt to access not owned prototype property',
      params: { value: { foo: 'test' }, path: 'property' },
      error: true,
    },
    {
      name: 'Attempt to access not owned constructor.prototype property',
      params: { value: { foo: 'test' }, path: 'constructor.prototype' },
      error: true,
    },
    {
      name: 'Access property with empty string key',
      params: { value: { '': 42 }, path: '[""]' },
      output: 42,
    },
    {
      name: 'Unmatched opening bracket',
      params: { value: { a: [42] }, path: 'a[0' },
      error: true,
    },
    {
      name: 'Unmatched opening bracket followed by dot',
      params: { value: { a: [{ b: 42 }] }, path: 'a[0.b' },
      error: true,
    },
    {
      name: 'Missing closing quote in bracket notation',
      params: { value: { foo: 'bar' }, path: '["foo]' },
      error: true,
    },
    {
      name: 'Missing opening quote in bracket notation',
      params: { value: { foo: 'bar' }, path: '[foo"]' },
      error: true,
    },
    {
      name: 'Escaped opening quote in bracket notation',
      params: { value: { foo: 'bar' }, path: '[\\"foo"]' },
      error: true,
    },
    {
      name: 'Escaped closing quote in bracket notation',
      params: { value: { foo: 'bar' }, path: '["foo\\"]' },
      error: true,
    },
    {
      name: 'Array index with non-latin digits',
      params: { value: [10, 20, 30], path: '[٢]' }, // '٢' is Arabic-Indic digit for 2
      error: true,
    },
    {
      name: 'Access escaped escape character',
      params: { value: { '\\': 'foo' }, path: '["\\\\"]' },
      output: 'foo',
    },
  ];

  for (const {
    name,
    params: { value, path },
    ...result
  } of testCases) {
    test(name, () => {
      if ('error' in result) {
        expect(() => followPath(value, path)).toThrow();
      } else {
        expect(followPath(value, path)).toEqual(result.output);
      }
    });
  }
});

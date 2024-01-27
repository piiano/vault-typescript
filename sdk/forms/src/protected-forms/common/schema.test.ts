import { describe, expect, test } from 'vitest';
import { array, boolean, literal, number, object, or, record, string } from './schema';

describe('validator', () => {
  const testCases = [
    {
      name: 'string',
      validator: string(),
      validValues: ['a', 'abc', ''],
      invalidValues: [1, {}, [], true, null, undefined],
    },
    {
      name: 'optional string',
      validator: string().optional(),
      validValues: ['a', 'abc', '', undefined],
      invalidValues: [1, {}, [], true, null],
    },
    {
      name: 'enum string',
      validator: string().enum('foo', 'bar'),
      validValues: ['foo', 'bar'],
      invalidValues: [1, {}, [], true, null, 'baz', undefined, 'foo1', 'FOO'],
    },
    {
      name: 'optional enum string',
      validator: string().enum('foo', 'bar').optional(),
      validValues: ['foo', 'bar', undefined],
      invalidValues: [1, {}, [], true, null, 'baz', 'foo1', 'FOO'],
    },
    {
      name: 'boolean',
      validator: boolean(),
      validValues: [true, false],
      invalidValues: [1, {}, [], 'a', null, undefined],
    },
    {
      name: 'optional boolean',
      validator: boolean().optional(),
      validValues: [true, false, undefined],
      invalidValues: [1, {}, [], 'a', null],
    },
    {
      name: 'number',
      validator: number(),
      validValues: [1, 1.2, 0, -1, -1.2],
      invalidValues: ['a', {}, [], true, null, undefined],
    },
    {
      name: 'optional number',
      validator: number().optional(),
      validValues: [1, 1.2, 0, -1, -1.2, undefined],
      invalidValues: ['a', {}, [], true, null],
    },
    {
      name: 'string array',
      validator: array(string()),
      validValues: [['a'], ['a', 'b'], []],
      invalidValues: [1, {}, true, null, undefined, [1], ['a', 1], ['a', undefined]],
    },
    {
      name: 'optional string array',
      validator: array(string()).optional(),
      validValues: [['a'], ['a', 'b'], [], undefined],
      invalidValues: [1, {}, true, null, [1], ['a', 1], ['a', undefined]],
    },
    {
      name: 'array of optional strings',
      validator: array(string().optional()),
      validValues: [['a'], ['a', 'b'], [], [undefined], ['a', undefined]],
      invalidValues: [1, {}, true, null, [1], ['a', 1]],
    },
    {
      name: 'number array',
      validator: array(number()),
      validValues: [[1], [1, 2], []],
      invalidValues: [1, {}, true, null, undefined, ['a'], [1, 'a'], [1, undefined]],
    },
    {
      name: 'boolean array',
      validator: array(boolean()),
      validValues: [[true], [true, false], []],
      invalidValues: [1, {}, 'a', null, undefined, [1], [true, 1], [true, undefined]],
    },
    {
      name: 'literal string or literal number',
      validator: or(literal('foo'), literal(42)),
      validValues: ['foo', 42],
      invalidValues: [1, {}, [], 'bar', true, null, undefined],
    },
    {
      name: 'object',
      validator: object({
        foo: string(),
        bar: number().optional(),
      }),
      validValues: [{ foo: 'a' }, { foo: 'a', bar: 1 }, { foo: 'a', bar: undefined }],
      invalidValues: [
        1,
        {},
        [],
        true,
        null,
        undefined,
        { foo: 1 },
        { foo: 'a', bar: 'b' },
        { bar: 1 },
        { foo: 'a', bar: 1, baz: 1 },
      ],
    },
    {
      name: 'objects array',
      validator: array(
        object({
          foo: string(),
          bar: number().optional(),
        }),
      ),
      validValues: [
        [{ foo: 'a' }],
        [{ foo: 'a' }, { foo: 'a', bar: 1 }],
        [{ foo: 'a', bar: 1 }],
        [{ foo: 'a', bar: undefined }],
        [],
      ],
      invalidValues: [
        1,
        {},
        true,
        null,
        undefined,
        [{ foo: 'a' }, { foo: 1 }],
        [{ foo: 1 }],
        [{ foo: 'a', bar: 'b' }],
        [{ bar: 1 }],
        [{ foo: 'a', bar: 1, baz: 1 }],
      ],
    },
    {
      name: 'record',
      validator: record(string(), number()),
      validValues: [{ a: 1 }, { a: 1, b: 2 }, {}],
      invalidValues: [1, [], true, null, undefined, { a: 'a' }, { a: 1, b: 'b' }],
    },
    {
      name: 'record of enums to enums',
      validator: record(string().enum('foo', 'bar'), number().enum(1, 2, 3)),
      validValues: [{ foo: 1 }, { foo: 1, bar: 2 }, {}],
      invalidValues: [
        1,
        [],
        true,
        null,
        undefined,
        { foo: 'a' },
        { foo: 1, bar: 'b' },
        { foo: 1, bar: 2, baz: 3 },
        { foo: 1, bar: 4 },
      ],
    },
  ];

  for (const { name, validator, validValues, invalidValues } of testCases) {
    describe(name, () => {
      for (const value of validValues) {
        test(`valid: ${JSON.stringify(value)}`, () => {
          expect(validator.parse(value)).toBe(true);
        });
      }

      for (const value of invalidValues) {
        test(`invalid: ${JSON.stringify(value)}`, () => {
          expect(validator.parse(value)).toBe(false);
        });
      }
    });
  }
});

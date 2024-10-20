/*
 * This file is a minimal zod like implementation for schema validation.
 * It's used to validate the options passed to the SDK and events passed in postMessage.
 * We use this instead of zod because it's smaller, and we don't want an extra dependency that we will have to maintain.
 */

export type Infer<V extends Validator<unknown>> = V extends Validator<infer U> ? U : never;
export type Validator<Type> = {
  parse(value: unknown): value is Type;
  optional(): Validator<Type | undefined>;
  enum<Value extends Type>(...values: Value[]): Validator<Value>;
};
type ValidatorFunc<Type> = Validator<Type>['parse'];
export type OneOf<Types extends unknown[]> = Types[number];
type Validators<Types extends unknown[]> = {
  [K in keyof Types]: Validator<Types[K]>;
};

export const literal = <Value extends string | boolean | number>(literalValue: Value) =>
  asValidator((value: unknown): value is Value => value === literalValue);
export const string = () => asValidator((value: unknown): value is string => typeof value === 'string');
export const number = () => asValidator((value: unknown): value is number => typeof value === 'number');
export const boolean = () => asValidator((value: unknown): value is boolean => typeof value === 'boolean');

export const array = <Type>(validator: Validator<Type>): Validator<Type[]> =>
  asValidator(
    (value): value is Type[] => Array.isArray(value) && value.every((itemValue) => validator.parse(itemValue)),
  );

// Take a type `{ foo: string } & { bar: boolean }` and convert it to a type `{ foo: string, bar: boolean }`.
// This is used purely for better IDE intellisense and readability when inspecting types.
export type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

// When defining an object schema, we pass a map of object keys to their validators.
type ObjectSchema = { [key: string]: Validator<unknown> };

// Represent the type of an object driven from the type of its schema.
type ObjectType<Schema extends ObjectSchema> =
  // Simplify to show both types as a single type for better intellisense and readability
  Simplify<
    {
      // for all keys of schema, if the value of that key can't be undefined, make it required.
      [K in keyof Schema as K extends unknown ? (Infer<Schema[K]> extends {} ? K : never) : never]: Infer<Schema[K]>;
    } & {
      // for all keys of schema, if the value of that key can be undefined, make it optional.
      [K in keyof Schema as K extends unknown ? (Infer<Schema[K]> extends {} ? never : K) : never]?: Infer<Schema[K]>;
    }
  >;

export const object = <Schema extends ObjectSchema>(schema: Schema) =>
  asValidator(
    (value): value is ObjectType<Schema> =>
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      // every field in value is in schema and passes validation
      Object.entries(value).every(([key, fieldValue]) => key in schema && schema[key].parse(fieldValue)) &&
      // every schema field is in the object or is valid as undefined indicating its optional
      Object.keys(schema).every((key) => key in value || (!(key in value) && schema[key].parse(undefined))),
  );

// This is like a normal Record type, but it makes all keys that have an optional value optional in the record.
type RecordType<Key extends string | number, Value, R = Record<Key, Value>> = Simplify<
  { [K in keyof R as K extends unknown ? (R[K] extends {} ? K : never) : never]: R[K] } & {
    [K in keyof R as K extends unknown ? (R[K] extends {} ? never : K) : never]?: R[K];
  }
>;

export const record = <Key extends string, Value>(
  keyValidator: Validator<Key>,
  valueValidator: Validator<Value>,
): Validator<RecordType<Key, Value>> =>
  asValidator(
    (value): value is RecordType<Key, Value> =>
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      Object.entries(value).every(([key, fieldValue]) => keyValidator.parse(key) && valueValidator.parse(fieldValue)),
  );

export const or = <Type1, Type2>(
  validator1: Validator<Type1>,
  validator2: Validator<Type2>,
): Validator<Type1 | Type2> =>
  asValidator((value: unknown): value is Type1 | Type2 => validator1.parse(value) || validator2.parse(value));

export const and = <Type1, Type2>(
  validator1: Validator<Type1>,
  validator2: Validator<Type2>,
): Validator<Type1 & Type2> =>
  asValidator((value: unknown): value is Type1 & Type2 => validator1.parse(value) && validator2.parse(value));

export const oneOf = <Types extends unknown[]>(...validators: Validators<Types>): Validator<OneOf<Types>> =>
  asValidator((value: unknown): value is OneOf<Types> => validators.some((validator) => validator.parse(value)));

export const optional = () => asValidator((value: unknown): value is undefined => typeof value === 'undefined');

function enumValidator<Type, Value extends Type>(values: Value[]): ValidatorFunc<Value> {
  const set = new Set(values);
  return (value: unknown): value is Value => set.has(value as Value);
}

// Create a validator from a validation function.
function asValidator<Type>(func: ValidatorFunc<Type>): Validator<Type> {
  return {
    parse: func,
    optional: () => asValidator(or(optional(), asValidator(func)).parse),
    enum: <Value extends Type>(...values: Value[]) => and(asValidator(func), asValidator(enumValidator(values))),
  };
}

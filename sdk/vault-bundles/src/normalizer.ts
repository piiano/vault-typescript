/**
 * A normalizer accepts a valid value of the type and returns a normalized value.
 * Two values have the same normalized value if they are considered equivalent instances of the type.
 */
export type Normalizer = (value: unknown) => unknown | Promise<unknown>;

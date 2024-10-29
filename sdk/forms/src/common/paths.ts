/**
 * Follows a path in an object or array using dot and bracket notation.
 * For example, given the object `{ a: { b: [10, 20, 30] } }`, the path `'a.b[1]'` would return `20`.
 *
 * Constraints:
 * - Omitting the path param will return the value itself as is.
 * - Dot notation may be used for object keys that are valid JS identifiers only.
 * - For object keys that are not valid JS identifiers, use bracket notation. (e.g. `["prop with spaces"]`, `["prop.with.dots"]`, `["🦄"]`, etc.)
 * - Array access is only allowed via bracket notation with unquoted valid integer indices. (e.g. `[0]`, `[1]`, `[42]`, etc.)
 * - Prototype methods and properties are not accessible unless there are actual properties with those names in the object. (e.g. `toString`, `length`, `__proto__`, etc.)
 * - Accessing properties on primitive values or null will throw an error.
 * - Accessing non-existent object properties or non-existent array indices will throw an error.
 */
export function followPath(value: unknown, path?: string): unknown {
  if (path === undefined) {
    return value;
  }

  const tokens = parsePath(path);

  if (tokens.length === 0) {
    throw new Error('Empty path');
  }

  // Follow each token in the path to get the final value
  return tokens.reduce(accessProperty, value);
}

type Token = {
  key: string;
  isQuoted: boolean;
  hasBrackets: boolean;
};

const indexKeyRegex = /^(0|[1-9][0-9]*)$/;
const identifierKeyRegex = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * Parses a path string into an array of tokens.
 * May throw an error if the path is invalid.
 */
function parsePath(path: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  const length = path.length;

  if (length === 0) {
    return tokens;
  }

  if (path[0] === '.') {
    throw new Error('Path cannot start with a dot');
  }

  while (index < length) {
    let hasBrackets = false;
    let isQuoted = false;
    let key = '';

    if (path[index] === '.') {
      index++; // Skip '.'
      if (index >= length) {
        throw new Error('Unexpected end of path');
      }
      key = parseKey();
    } else if (path[index] === '[') {
      hasBrackets = true;
      index++; // Skip '['
      if (index >= length) {
        throw new Error('Unexpected end of path');
      }
      if (path[index] === '"' || path[index] === "'") {
        isQuoted = true;
        key = parseQuotedKey();
      } else {
        key = parseUnquotedKey();
      }
    } else {
      key = parseKey();
    }

    tokens.push({ key, isQuoted, hasBrackets });
  }

  return tokens;

  function parseKey(): string {
    let key = '';
    while (index < length && path[index] !== '.' && path[index] !== '[') {
      key += path[index++];
    }
    if (key === '') {
      throw new Error('Empty key');
    }
    if (!identifierKeyRegex.test(key)) {
      throw new Error(`Invalid identifier '${key}'`);
    }
    return key;
  }

  function parseQuotedKey(): string {
    const quoteChar = path[index++];
    let key = '';
    while (index < length) {
      if (path[index] === '\\') {
        index++;
        if (index >= length) {
          throw new Error('Invalid escape sequence');
        }
        key += path[index++];
      } else if (path[index] === quoteChar) {
        index++;
        if (index >= length || path[index] !== ']') {
          throw new Error('Expected closing bracket');
        }
        index++; // Skip ']'
        return key;
      } else {
        key += path[index++];
      }
    }
    throw new Error('Unterminated quoted key');
  }

  function parseUnquotedKey(): string {
    let key = '';
    while (index < length && path[index] !== ']') {
      key += path[index++];
    }
    if (index >= length || path[index] !== ']') {
      throw new Error('Expected closing bracket');
    }
    index++; // Skip ']'
    if (key === '') {
      throw new Error('Empty key');
    }
    // Unquoted keys must be numeric for arrays
    if (!indexKeyRegex.test(key)) {
      throw new Error('Invalid key in bracket notation');
    }
    return key;
  }
}

/**
 * Traverses a value one step deeper using the given token.
 * May throw an error if the value is not traversable or the token is invalid for the value type.
 */
function accessProperty(currentValue: unknown, { key, isQuoted, hasBrackets }: Token): unknown {
  if (typeof currentValue !== 'object' || currentValue === null) {
    throw new Error('Cannot access property on non-object');
  }

  if (Array.isArray(currentValue)) {
    // Only allow array access via unquoted numeric indices in bracket notation
    if (!hasBrackets || isQuoted) {
      throw new Error('Invalid array access');
    }

    const index = parseInt(key, 10);
    if (index < 0 || index >= currentValue.length) {
      throw new Error(`Array index out of bounds: ${index}`);
    }

    return currentValue[index];
  }

  // For objects
  if (hasBrackets && !isQuoted) {
    throw new Error('Invalid key in bracket notation');
  }

  if (!Object.prototype.hasOwnProperty.call(currentValue, key)) {
    throw new Error(`Property ${key} does not exist`);
  }

  return (currentValue as { [key: string]: unknown })[key];
}

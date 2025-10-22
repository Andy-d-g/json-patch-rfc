// ⚠️ FORKED FROM : fast-json-patch

/**
 * Checks whether an object has a given property as its own.
 *
 * @param obj - The object to check.
 * @param key - The property key.
 * @returns True if the object has the property as its own, false otherwise.
 */
export function hasOwnProperty(obj: Object, key: string) {
  return Object.hasOwn(obj, key);
}

/**
 * Returns the keys of an object or array.
 *
 * @param obj - The object or array.
 * @returns Array of keys (string indices for arrays, object keys otherwise).
 */
export function _objectKeys(obj: Object): string[] {
  if (Array.isArray(obj)) {
    const keys = new Array(obj.length);
    for (let k = 0; k < keys.length; k++) {
      keys[k] = `${k}`;
    }
    return keys;
  }
  return Object.keys(obj);
}

/**
 * Normalizes a JSON Pointer path, replacing "-" with the array length.
 *
 * @param list - The array associated with the path.
 * @param path - The path to normalize.
 * @returns Normalized path.
 */
export function normalizePath(list: unknown[], path: string): string {
  if (path.at(-1) !== "-") return path;
  const npath = path.split("/");
  npath[path.length - 1] = list.length.toString();
  return npath.join("/");
}

/**
 * Checks if a string represents an integer.
 *
 * Faster than regex check `/^\d+$/`.
 *
 * @param str - The string to check.
 * @returns True if the string is an integer, false otherwise.
 */
export function isInteger(str: string): boolean {
  let i = 0;
  const len = str.length;
  let charCode = -1;
  while (i < len) {
    charCode = str.charCodeAt(i);
    if (charCode >= 48 && charCode <= 57) {
      i++;
      continue;
    }
    return false;
  }
  return true;
}

/**
 * Escapes a JSON Pointer path component.
 *
 * @param path - The raw pointer string.
 * @returns Escaped path component.
 */
export function escapePathComponent(path: string): string {
  if (path.indexOf("/") === -1 && path.indexOf("~") === -1) return path;
  return path.replace(/~/g, "~0").replace(/\//g, "~1");
}

/**
 * Unescapes a JSON Pointer path component.
 *
 * @param path - The escaped pointer string.
 * @returns Unescaped path component.
 */
export function unescapePathComponent(path: string): string {
  return path.replace(/~1/g, "/").replace(/~0/g, "~");
}

/**
 * Recursively finds the JSON Pointer path to an object within a root object.
 *
 * @param root - Root object to search.
 * @param obj - Target object to find.
 * @returns The path to the object, ending with a slash, or empty string if not found.
 */
export function _getPathRecursive(root: any, obj: Object): string {
  let found = "";
  for (const key in root) {
    if (hasOwnProperty(root, key)) {
      if (root[key] === obj) {
        return `${escapePathComponent(key)}/`;
      } else if (typeof root[key] === "object") {
        found = _getPathRecursive(root[key], obj);
        if (found !== "") {
          return `${escapePathComponent(key)}/${found}`;
        }
      }
    }
  }
  return "";
}

/**
 * Checks if a value is a plain object (not array or null).
 *
 * @param value - Value to check.
 * @returns True if the value is a plain object.
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && Array.isArray(value) === false && value !== null;
}

/**
 * Deep equality check for two values (objects, arrays, or primitives).
 *
 * Based on fast-deep-equal (MIT License).
 *
 * @param a - First value.
 * @param b - Second value.
 * @returns True if values are deeply equal, false otherwise.
 */
export function areEquals(a: any, b: any): boolean {
  if (a === b) return true;

  if (a && b && typeof a === "object" && typeof b === "object") {
    const arrA = Array.isArray(a);
    const arrB = Array.isArray(b);

    if (arrA && arrB) {
      const length = a.length;
      if (length !== b.length) return false;
      for (let i = length; i-- !== 0; ) {
        if (!areEquals(a[i], b[i])) return false;
      }
      return true;
    }

    if (arrA !== arrB) return false;

    const keys = Object.keys(a);
    const length = keys.length;

    if (length !== Object.keys(b).length) {
      return false;
    }

    for (let i = length; i-- !== 0; ) {
      if (!Object.hasOwn(b, keys[i])) return false;
    }

    for (let i = length; i-- !== 0; ) {
      const key = keys[i];
      if (!areEquals(a[key], b[key])) return false;
    }

    return true;
  }

  // biome-ignore lint/suspicious/noSelfCompare: <from the fork>
  return a !== a && b !== b;
}

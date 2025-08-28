// ⚠️ FORKED FROM : fast-json-patch

export function hasOwnProperty(obj: Object, key: string) {
  return Object.hasOwn(obj, key);
}

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

export function normalizePath(list: unknown[], path: string): string {
  if (path.at(-1) !== "-") return path;
  const npath = path.split("/");
  npath[path.length - 1] = list.length.toString();
  return npath.join("/");
}

//3x faster than cached /^\d+$/.test(str)
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
 * Escapes a json pointer path
 * @param path The raw pointer
 * @return the Escaped path
 */
export function escapePathComponent(path: string): string {
  if (path.indexOf("/") === -1 && path.indexOf("~") === -1) return path;
  return path.replace(/~/g, "~0").replace(/\//g, "~1");
}
/**
 * Unescapes a json pointer path
 * @param path The escaped pointer
 * @return The unescaped path
 */
export function unescapePathComponent(path: string): string {
  return path.replace(/~1/g, "/").replace(/~0/g, "~");
}

// TODO : CHANGE
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

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && Array.isArray(value) === false && value !== null;
}

// based on https://github.com/epoberezkin/fast-deep-equal
// MIT License

// Copyright (c) 2017 Evgeny Poberezkin

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
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

  // biome-ignore lint/suspicious/noSelfCompare: <code from a lib : probably a good reason>
  return a !== a && b !== b;
}

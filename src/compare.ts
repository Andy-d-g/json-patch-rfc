import type { Doc } from "./doc.js";
import { _objectKeys, escapePathComponent, hasOwnProperty } from "./helpers.js";
import type { Operation } from "./operations.js";

// ⚠️ FORKED FROM : fast-json-patch

// Dirty check if obj is different from mirror, generate patches and update mirror
function _compare(mirror: Doc, obj: Doc, patches: Operation[], path: string) {
  if (obj === mirror) {
    return;
  }

  const newKeys = _objectKeys(obj);
  const oldKeys = _objectKeys(mirror);
  let deleted = false;

  //if ever "move" operation is implemented here, make sure this test runs OK: "should not generate the same patch twice (move)"

  for (let t = oldKeys.length - 1; t >= 0; t--) {
    const key = oldKeys[t];
    const oldVal = (mirror as any)[key];

    if (
      hasOwnProperty(obj, key) &&
      !((obj as any)[key] === undefined && oldVal !== undefined && Array.isArray(obj) === false)
    ) {
      const newVal = (obj as any)[key];

      if (
        typeof oldVal === "object" &&
        oldVal != null &&
        typeof newVal === "object" &&
        newVal != null &&
        Array.isArray(oldVal) === Array.isArray(newVal)
      ) {
        _compare(oldVal, newVal, patches, `${path}/${escapePathComponent(key)}`);
      } else {
        if (oldVal !== newVal) {
          patches.push({ op: "replace", path: `${path}/${escapePathComponent(key)}`, value: structuredClone(newVal) });
        }
      }
    } else if (Array.isArray(mirror) === Array.isArray(obj)) {
      patches.push({ op: "remove", path: `${path}/${escapePathComponent(key)}` });
      deleted = true; // property has been deleted
    } else {
      patches.push({ op: "replace", path, value: obj });
    }
  }

  if (!deleted && newKeys.length === oldKeys.length) {
    return;
  }

  for (let t = 0; t < newKeys.length; t++) {
    const key = newKeys[t];
    if (!hasOwnProperty(mirror, key) && (obj as any)[key] !== undefined) {
      patches.push({
        op: "add",
        path: `${path}/${escapePathComponent(key)}`,
        value: structuredClone((obj as any)[key])
      });
    }
  }
}

/**
 * Create an array of patches of the differences between the two objects.
 * Returns the list of operations to reproduce the source.
 *
 * @param from The document original
 * @param dest The document original
 * @return An array of `operation` to patch `from` to `dest`
 */
function compare(from: Doc, dest: Doc): Operation[] {
  const operations = Array.of<Operation>();
  _compare(from, dest, operations, "");
  return operations;
}

export default compare;

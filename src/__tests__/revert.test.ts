import type { Doc } from "../doc";
import { describe, it, expect } from "vitest";
import applyOperations from "../apply";
import revertOperations from "../revert";
import type { Operation } from "../operations";

function testReversion<T extends Doc>(title: string, doc: T, doOps: Operation[]) {
  it(title, () => {
    const original = structuredClone(doc);
    const updated = structuredClone(doc);

    // Get the revert operations
    const undoOps = revertOperations(original, doOps);

    // Apply the operation(s)
    applyOperations(updated, doOps, { mutate: true });

    // Apply revert operations
    for (const ops of undoOps) {
      applyOperations(updated, ops, { mutate: true });
    }

    expect(updated).toStrictEqual(original);
  });
}

describe("add", () => {
  testReversion("on object", { name: "Alice" }, [
    { op: "add", path: "/age", value: 30 }
  ]);
  testReversion("on array", [1, 2, 3], [
    { op: "add", path: "/1", value: 999 }
  ]);
  testReversion("append to array with '-'", [1, 2], [
    { op: "add", path: "/-", value: 3 }
  ]);
  testReversion("add nested key", { user: { name: "Alice" } }, [
    { op: "add", path: "/user/age", value: 25 }
  ]);
  testReversion("add to empty object", {}, [
    { op: "add", path: "/hello", value: "world" }
  ]);
  testReversion("add to empty array at index 0", [], [
    { op: "add", path: "/0", value: "first" }
  ]);
  testReversion("insert into nested array", { a: [1, 2, 3] }, [
    { op: "add", path: "/a/1", value: 42 }
  ]);
  testReversion("add into deeply nested structure", { a: { b: { c: [] } } }, [
    { op: "add", path: "/a/b/c/0", value: "x" }
  ]);
  testReversion("add using number-as-object-key", {}, [
    { op: "add", path: "/42", value: "answer" }
  ]);
  testReversion("add null value", {}, [
    { op: "add", path: "/nothing", value: null }
  ]);
  testReversion("add boolean value", {}, [
    { op: "add", path: "/flag", value: true }
  ]);
});

describe("remove", () => {
  testReversion("on object", { name: "Alice", age: 30 }, [
    { op: "remove", path: "/age" }
  ]);
  testReversion("on array", [1, 2, 3], [
    { op: "remove", path: "/1" }
  ]);
  testReversion("remove from start of array", [99, 100, 101], [
    { op: "remove", path: "/0" }
  ]);
  testReversion("remove from end of array", ["a", "b", "c"], [
    { op: "remove", path: "/2" }
  ]);
  testReversion("remove from nested object", { user: { name: "Alice", age: 25 } }, [
    { op: "remove", path: "/user/age" }
  ]);
  testReversion("remove from deeply nested object", { a: { b: { c: { d: 42 } } } }, [
    { op: "remove", path: "/a/b/c/d" }
  ]);
  testReversion("remove from nested array", { items: [10, 20, 30] }, [
    { op: "remove", path: "/items/1" }
  ]);
  testReversion("remove from array of objects", [{ id: 1 }, { id: 2 }, { id: 3 }], [
    { op: "remove", path: "/1" }
  ]);
  testReversion("remove boolean property", { visible: true, hidden: false }, [
    { op: "remove", path: "/hidden" }
  ]);
  testReversion("remove null property", { value: null }, [
    { op: "remove", path: "/value" }
  ]);
  testReversion("remove number-like key", { "42": "answer", "name": "test" }, [
    { op: "remove", path: "/42" }
  ]);
});

describe("replace", () => {
  testReversion("on object", { name: "Alice", age: 30 }, [
    { op: "replace", path: "/age", value: 99 }
  ]);
  testReversion("on nested object", { address: { city: "Tokyo" } }, [
    { op: "replace", path: "/address/city", value: "Kyoto" }
  ]);
  testReversion("replace boolean value", { active: true }, [
    { op: "replace", path: "/active", value: false }
  ]);
  testReversion("replace null with value", { deletedAt: null }, [
    { op: "replace", path: "/deletedAt", value: "2023-01-01T00:00:00Z" }
  ]);
  testReversion("replace value with null", { deletedAt: "2023-01-01T00:00:00Z" }, [
    { op: "replace", path: "/deletedAt", value: null }
  ]);
  testReversion("replace value in array", ["a", "b", "c"], [
    { op: "replace", path: "/1", value: "B" }
  ]);
  testReversion("replace object inside array", [{ id: 1 }, { id: 2 }], [
    { op: "replace", path: "/1", value: { id: 42 } }
  ]);
  testReversion("replace number-like key", { "42": "answer" }, [
    { op: "replace", path: "/42", value: "not-the-answer" }
  ]);
  testReversion("replace deeply nested array value", { a: [[1, 2], [3, 4]] }, [
    { op: "replace", path: "/a/1/0", value: 99 }
  ]);
  testReversion("replace entire nested object", { profile: { name: "Alice", age: 30 } }, [
    { op: "replace", path: "/profile", value: { name: "Bob", age: 31 } }
  ]);
  testReversion("replace string value", { greeting: "hello" }, [
    { op: "replace", path: "/greeting", value: "hi" }
  ]);
});

describe("move", () => {
  testReversion("within object", { a: 1, b: 2 }, [
    { op: "move", from: "/a", path: "/b" }
  ]);
  testReversion("from object to array", { a: 1, b: [2] }, [
    { op: "move", from: "/a", path: "/b/0" }
  ]);
  testReversion("from array to object", { a: [1], b: 2 }, [
    { op: "move", from: "/a", path: "/b" }
  ]);
  testReversion("nested move in object", [{ a: 1, b: { c: 3 } }], [
    { op: "move", from: "/0/a", path: "/0/b/c" }
  ]);
  testReversion("move from array index to object key", { a: [10, 20], b: {} }, [
    { op: "move", from: "/a/1", path: "/b/val" }
  ]);
  testReversion("move between nested arrays", { x: [[1], [2]] }, [
    { op: "move", from: "/x/0/0", path: "/x/1/0" }
  ]);
  testReversion("move into array using - (append)", { a: 1, b: [2] }, [
    { op: "move", from: "/a", path: "/b/-" }
  ]);
  testReversion("move into array using - (append)", { a: 1, b: [2] }, [
    { op: "move", from: "/a", path: "/b/-" }
  ]);
  testReversion("move into empty array", { a: 1, b: [] }, [
    { op: "move", from: "/a", path: "/b/0" }
  ]);
  testReversion("move into empty array", { a: 1, b: [] }, [
    { op: "move", from: "/a", path: "/b/0" }
  ]);
  testReversion("self move", { x: 1 }, [
    { op: "move", from: "/x", path: "/x" }
  ]);
  testReversion("move from nested to root", { a: { b: { c: 42 } } }, [
    { op: "move", from: "/a/b/c", path: "/c" }
  ]);
  testReversion("move root key", { a: 1, b: 2 }, [
    { op: "move", from: "/a", path: "/z" }
  ]);
  testReversion("within array (2 → 0)", [1, 2, 3], [
    { op: "move", from: "/2", path: "/0" }
  ]);
  testReversion("to nested array field", [{ a: 2 }, { a: 3, b: [] }, { a: 1 }], [
    { op: "move", from: "/2", path: "/1/b" }
  ]);
  testReversion("to nested array field (head)", [{ a: 1 }, { a: 2 }, { a: 3, b: [] }], [
    { op: "move", from: "/0", path: "/1/b" }
  ]);
  testReversion("from nested array to object", [{ a: [1], b: 2 }], [
    { op: "move", from: "/0/a", path: "/0/b" }
  ]);
  testReversion("within array (0 → 2)", [1, 2, 3], [
    { op: "move", from: "/0", path: "/2" }
  ]);
});

describe("copy", () => {
  testReversion("on object", { x: 1 }, [
    { op: "copy", from: "/x", path: "/y" }
  ]);

  testReversion("in array", [10, 20, 30], [
    { op: "copy", from: "/1", path: "/3" }
  ]);

  testReversion("copy entire object property", { user: { name: "Alice" } }, [
    { op: "copy", from: "/user", path: "/profile" }
  ]);

  testReversion("copy nested value", { a: { b: { c: 42 } } }, [
    { op: "copy", from: "/a/b/c", path: "/a/b/d" }
  ]);

  testReversion("copy to nested object", { config: {}, theme: { dark: true } }, [
    { op: "copy", from: "/theme/dark", path: "/config/enabled" }
  ]);

  testReversion("copy object inside array", [{ id: 1 }, { id: 2 }], [
    { op: "copy", from: "/0", path: "/2" }
  ]);

  testReversion("copy null value", { x: null }, [
    { op: "copy", from: "/x", path: "/y" }
  ]);

  testReversion("copy boolean", { flag: true }, [
    { op: "copy", from: "/flag", path: "/copiedFlag" }
  ]);

  testReversion("copy string", { name: "Monroe" }, [
    { op: "copy", from: "/name", path: "/alias" }
  ]);

  testReversion("copy number-like key", { "42": "meaning" }, [
    { op: "copy", from: "/42", path: "/copyOf42" }
  ]);

  testReversion("copy deeply nested array item", { matrix: [[1, 2], [3, 4]] }, [
    { op: "copy", from: "/matrix/1/0", path: "/matrix/0/2" }
  ]);
});

describe("test", () => {
  testReversion("noop", { status: "active" }, [
    { op: "test", path: "/status", value: "active" }
  ]);
});

describe("_get", () => {
  testReversion("get top-level key", { foo: "bar" }, [
    { op: "_get", path: "/foo", value: "bar" }
  ]);
  testReversion("get root", { a: 1, b: 2 }, [
    { op: "_get", path: "", value: { a: 1, b: 2 } }
  ]);
  testReversion("get nested object value", { user: { name: "Alice" } }, [
    { op: "_get", path: "/user/name", value: "Alice" }
  ]);
  testReversion("get array index", [10, 20, 30], [
    { op: "_get", path: "/1", value: 20 }
  ]);
  testReversion("get nested array value", { list: [[1], [2, 3]] }, [
    { op: "_get", path: "/list/1/1", value: 3 }
  ]);
  testReversion("get boolean value", { active: false }, [
    { op: "_get", path: "/active", value: false }
  ]);
  testReversion("get null value", { deleted: null }, [
    { op: "_get", path: "/deleted", value: null }
  ]);
  testReversion("get number value", { count: 42 }, [
    { op: "_get", path: "/count", value: 42 }
  ]);
  testReversion("get object with numeric key", { "42": "life" }, [
    { op: "_get", path: "/42", value: "life" }
  ]);
  testReversion("get deeply nested value", { a: { b: { c: "end" } } }, [
    { op: "_get", path: "/a/b/c", value: "end" }
  ]);
});

import { describe, it, expect } from "vitest";
import type { Operation } from "../operations";
import applyOperations from "../apply";

describe("applyOperations", () => {
  describe("_get operation", () => {
    it("should get root value", () => {
      const obj = [{ people: [{ name: "Marilyn" }, { name: "Monroe" }] }];
      const patchset = Array.of<Operation>({ op: "_get", path: "", value: null });

      const result = applyOperations(obj, patchset);
      expect(result).toEqual(obj);
    });

    it("should get deep value", () => {
      const obj = { people: [{ name: "Marilyn" }, { name: "Monroe" }] };
      const patchset = Array.of<Operation>({ op: "_get", path: "/people/1/name", value: null });

      const result = applyOperations(obj, patchset);
      expect(result).toEqual(obj);
    });
  });

  describe("add operation", () => {
    it("should add an object as root", () => {
      const obj = { hello: "world" };
      const patchset = Array.of<Operation>({ op: "add", path: "", value: { hello: "universe" } });

      const result = applyOperations(obj, patchset);
      expect(result).toEqual({ hello: "universe" });
    });

    it("should add a nested property", () => {
      const obj = { hello: "world" };
      const patchset = Array.of<Operation>({ op: "add", path: "/bye", value: "universe" });

      const result = applyOperations(obj, patchset);
      expect(result).toEqual({ hello: "world", bye: "universe" });
    });

    it("should add into an array", () => {
      const obj = { items: [1, 2, 3] };
      const patchset = Array.of<Operation>({ op: "add", path: "/items/1", value: 1.5 });

      const result = applyOperations(obj, patchset);
      expect(result).toEqual({ items: [1, 1.5, 2, 3] });
    });

    it("should update the root value", () => {
      const obj = { items: [] };
      const patchset = Array.of<Operation>({ op: "add", path: "/items", value: 1.5 });

      const result = applyOperations(obj, patchset);
      expect(result).toEqual({ items: 1.5 });
    });
  });

  describe("replace operation", () => {
    it("should replace root object", () => {
      const obj = { hello: "world" };
      const patchset = Array.of<Operation>({ op: "replace", path: "", value: { hello: "universe" } });

      const result = applyOperations(obj, patchset);
      expect(result).toEqual({ hello: "universe" });
    });

    it("should replace a nested value", () => {
      const obj = { hello: "world" };
      const patchset = Array.of<Operation>({ op: "replace", path: "/hello", value: "universe" });

      const result = applyOperations(obj, patchset);
      expect(result).toEqual({ hello: "universe" });
    });
  });

  describe("remove operation", () => {
    it("should remove root", () => {
      const obj = { hello: "world" };
      const patchset = Array.of<Operation>({ op: "remove", path: "" });

      const result = applyOperations(obj, patchset);
      expect(result).toEqual(null);
    });

    it("should remove a nested property", () => {
      const obj = { hello: "world", bye: "universe" };
      const patchset = Array.of<Operation>({ op: "remove", path: "/bye" });

      const result = applyOperations(obj, patchset);
      expect(result).toEqual({ hello: "world" });
    });
  });

  describe("move operation", () => {
    it("should move a property", () => {
      const obj = { foo: 1, bar: 2 };
      const patchset = Array.of<Operation>({ op: "move", from: "/foo", path: "/baz" });

      const result = applyOperations(obj, patchset);
      expect(result).toEqual({ bar: 2, baz: 1 });
    });

    it("should move a branch", () => {
      const original = {
        tag: "1",
        children: [
          { tag: "2", children: [] },
          { tag: "3", children: [] },
          {
            tag: "4",
            children: [
              { tag: "6", children: [] },
              { tag: "7", children: [] }
            ]
          }
        ]
      };
      const updated = {
        tag: "1",
        children: [
          { tag: "3", children: [] },
          {
            tag: "4",
            children: [
              { tag: "6", children: [] },
              { tag: "7", children: [] },
              { tag: "2", children: [] }
            ]
          }
        ]
      };
      const patchset = Array.of<Operation>({ op: "move", from: "/children/0", path: "/children/1/children/2" });

      const result = applyOperations(original, patchset);
      expect(result).toEqual(updated);
    });
  });

  describe("copy operation", () => {
    it("should copy a property", () => {
      const obj = { foo: 1 };
      const patchset = Array.of<Operation>({ op: "copy", from: "/foo", path: "/bar" });

      const result = applyOperations(obj, patchset);
      expect(result).toEqual({ foo: 1, bar: 1 });
    });
  });

  describe("test operation", () => {
    it("should succeed for correct test value", () => {
      const obj = { foo: "bar" };
      const patchset = Array.of<Operation>({ op: "test", path: "/foo", value: "bar" });

      const result = applyOperations(obj, patchset);
      expect(result).toEqual(obj);
    });

    it("should throw for incorrect test value", () => {
      const obj = { foo: "bar" };
      const patchset = Array.of<Operation>({ op: "test", path: "/foo", value: "baz" });

      expect(() => applyOperations(obj, patchset)).toThrow();
    });
  });
});

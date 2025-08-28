import { describe, it, expect } from "vitest";
import compare from "../compare";

describe("compare", () => {
  it("should handle root array replacement with object", () => {
    const objA = ["jack"];
    const objB = {};
    const patches = compare(objA, objB);

    expect(patches).toEqual([
      {
        op: "replace",
        path: "",
        value: objB
      }
    ]);
  });

  it("should add a missing property in second object", () => {
    const objA = { user: { firstName: "Albert" } };
    const objB = { user: { firstName: "Albert", lastName: "Einstein" } };

    const patches = compare(objA, objB);

    expect(patches).toEqual([
      {
        op: "add",
        path: "/user/lastName",
        value: "Einstein"
      }
    ]);
  });

  it("should remove a property missing in second object", () => {
    const objA = { user: { firstName: "Albert", lastName: "Einstein" } };
    const objB = { user: { firstName: "Albert" } };

    const patches = compare(objA, objB);

    expect(patches).toEqual([
      {
        op: "remove",
        path: "/user/lastName"
      }
    ]);
  });

  it("should replace a property if values differ", () => {
    const objA = { user: { firstName: "Albert", lastName: "Einstein" } };
    const objB = { user: { firstName: "Albert", lastName: "Newton" } };

    const patches = compare(objA, objB);

    expect(patches).toEqual([
      {
        op: "replace",
        path: "/user/lastName",
        value: "Newton"
      }
    ]);
  });

  it("should not produce patches for equal undefined values", () => {
    const objA = { user: undefined };
    const objB = { user: undefined };

    const patches = compare(objA, objB);

    expect(patches).toEqual([]);
  });

  it("should detect array differences", () => {
    const objA = { list: [1, 2, 3] };
    const objB = { list: [1, 2, 4] };

    const patches = compare(objA, objB);

    expect(patches).toEqual([
      {
        op: "replace",
        path: "/list/2",
        value: 4
      }
    ]);
  });

  it("should not modify the source object", () => {
    const obj = { foo: "bar" };
    compare(obj, { foo: "baz" });
    expect(obj.foo).toBe("bar");
  });

  it("should replace null with object", () => {
    const objA = { user: null };
    const objB = { user: {} };

    const patches = compare(objA, objB);

    expect(patches).toEqual([
      {
        op: "replace",
        path: "/user",
        value: {}
      }
    ]);
  });

  it("should replace object with null", () => {
    const objA = { user: {} };
    const objB = { user: null };

    const patches = compare(objA, objB);

    expect(patches).toEqual([
      {
        op: "replace",
        path: "/user",
        value: null
      }
    ]);
  });

  it("should replace 0 with empty string", () => {
    const objA = { user: 0 };
    const objB = { user: "" };

    const patches = compare(objA, objB);

    expect(patches).toEqual([
      {
        op: "replace",
        path: "/user",
        value: ""
      }
    ]);
  });

  it("should work with plain objects without prototype", () => {
    const one = Object.create(null);
    const two = Object.create(null);
    one.a = 1;
    two.a = 2;

    const patches = compare(one, two);

    expect(patches).toEqual([
      {
        op: "replace",
        path: "/a",
        value: 2
      }
    ]);
  });
});

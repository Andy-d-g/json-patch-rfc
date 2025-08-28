import type { Doc } from "./doc";
import { InvalidKeyError, TestFailError, UnknownOperationError, UnresolvablePathError } from "./error";
import { areEquals, isInteger, isObject, unescapePathComponent } from "./helpers";
import type {
  AddOperation,
  CopyOperation,
  GetOperation,
  MoveOperation,
  Operation,
  RemoveOperation,
  ReplaceOperation,
  TestOperation
} from "./operations";

function getInvalidKeyError(operationIndex: number, operation: Operation, doc: unknown) {
  return new InvalidKeyError({
    message: `The operation '${operationIndex}' pointer must be an object with a string key or an array with a number key`,
    operation,
    operationIndex,
    doc
  });
}

type Key = string | number;

class Patcher {
  private doc: unknown;

  constructor(doc: Doc, mutate: boolean) {
    if (mutate) {
      this.doc = doc;
      return;
    }
    this.doc = structuredClone(doc);
  }

  get() {
    return this.doc;
  }

  applyOperation(op: Operation, opIndex: number) {
    if (op.path === "") {
      return this.applyToRoot(op, opIndex);
    }
    return this.applyInDepth(op, opIndex);
  }

  private applyToRoot(op: Operation, opIndex: number) {
    if (op.op === "add") {
      this.doc = op.value;
      return;
    }
    if (op.op === "replace") {
      this.doc = op.value;
      return;
    }
    if (op.op === "move" || op.op === "copy") {
      this.doc = this.getValueByPointer(op.from, opIndex);
      return;
    }
    if (op.op === "test") {
      this.test(op, this.doc, opIndex);
      return;
    }
    if (op.op === "remove") {
      this.doc = null;
      return;
    }
    if (op.op === "_get") {
      op.value = this.doc;
      return;
    }
    throw new UnknownOperationError({
      message: `Operation '${opIndex}' is not one of operations defined in RFC-6902`,
      operation: op,
      operationIndex: opIndex,
      doc: this.doc
    });
  }

  private applyInDepth(op: Operation, opIndex: number) {
    if (op.op === "copy") {
      return this.copy(op, opIndex);
    }
    if (op.op === "move") {
      return this.move(op, opIndex);
    }
    // cut the blank key
    const keys = op.path.split("/").slice(1);
    let ptr: unknown = this.doc;
    // Iterate on all the keys less 1 to apply to the last key
    for (let keyIndex = 0; keyIndex < keys.length - 1; keyIndex++) {
      let key = keys[keyIndex];
      // If we have more keys in the path, but the next value isn't a non-null object,
      // throw an OPERATION_PATH_UNRESOLVABLE error instead of iterating again.
      if (!ptr || (!isObject(ptr) && !Array.isArray(ptr))) {
        throw new UnresolvablePathError({
          message: `The operation '${opIndex}' path leads to an invalid pointer type '${typeof ptr}'. Only objects or arrays can be browsed`,
          operation: op,
          operationIndex: opIndex,
          doc: this.doc
        });
      }
      if (key && key.indexOf("~") !== -1) {
        key = unescapePathComponent(key);
      }
      if (!Array.isArray(ptr)) {
        ptr = (ptr as Record<string, unknown>)[key];
        continue;
      }
      if (key === "-") {
        key = `${ptr.length}`;
      }
      if (!isInteger(key)) {
        throw new UnresolvablePathError({
          message: `The operation '${opIndex}' path leads to an invalid array index value : ${key}`,
          operation: op,
          operationIndex: opIndex,
          doc: this.doc
        });
      }
      // Convert to integer
      ptr = ptr[~~key];
    }

    const lastKey = keys.at(-1)!;
    if (!isObject(ptr) && !Array.isArray(ptr)) {
      throw new UnresolvablePathError({
        message: `The operation '${opIndex}' path leads to an invalid pointer type '${typeof ptr}'. Only objects or arrays can be browsed`,
        operation: op,
        operationIndex: opIndex,
        doc: this.doc
      });
    }
    if (isObject(ptr)) {
      return this.execOperation(op, ptr, lastKey, opIndex);
    }
    const lastIndex = lastKey === "-" ? ptr.length : ~~lastKey;
    if (lastIndex > ptr.length) {
      throw new UnresolvablePathError({
        message: `The operation '${opIndex}' path leads to a out an index '${lastIndex}' greater than the array size '${(ptr as unknown[]).length}'`,
        operation: op,
        operationIndex: opIndex,
        doc: this.doc
      });
    }
    return this.execOperation(op, ptr, lastIndex, opIndex);
  }

  private execOperation(op: Operation, ptr: Doc, key: Key, opIndex: number) {
    switch (op.op) {
      case "_get":
        return this._get(op, ptr, key, opIndex);
      case "add":
        return this.add(op, ptr, key, opIndex);
      case "copy":
        return this.copy(op, opIndex);
      case "move":
        return this.move(op, opIndex);
      case "remove":
        return this.remove(op, ptr, key, opIndex);
      case "replace":
        return this.replace(op, ptr, key, opIndex);
      case "test": {
        if (Array.isArray(ptr) && typeof key === "number") {
          return this.test(op, ptr[key], opIndex);
        }
        if (isObject(ptr) && typeof key === "string") {
          return this.test(op, ptr[key], opIndex);
        }
        throw getInvalidKeyError(opIndex, op, this.doc);
      }
    }
  }

  private add(op: AddOperation, ptr: Doc, key: Key, opIndex: number) {
    if (Array.isArray(ptr) && typeof key === "number") {
      ptr.splice(key, 0, op.value);
      return this.doc;
    }
    if (isObject(ptr) && typeof key === "string") {
      ptr[key] = op.value;
      return this.doc;
    }
    throw getInvalidKeyError(opIndex, op, this.doc);
  }

  private remove(op: RemoveOperation, ptr: Doc, key: Key, opIndex: number) {
    if (Array.isArray(ptr) && typeof key === "number") {
      ptr.splice(key, 1);
      return this.doc;
    }
    if (isObject(ptr) && typeof key === "string") {
      delete ptr[key];
      return this.doc;
    }
    throw getInvalidKeyError(opIndex, op, this.doc);
  }

  private move(op: MoveOperation, opIndex: number) {
    const value = structuredClone(this.getValueByPointer(op.from, opIndex));
    this.applyOperation({ op: "remove", path: op.from }, opIndex);
    this.applyOperation({ op: "add", path: op.path, value }, opIndex);
    return this.doc;
  }

  private replace(op: ReplaceOperation, ptr: Doc, key: Key, opIndex: number) {
    if (Array.isArray(ptr) && typeof key === "number") {
      ptr[key] = op.value;
      return this.doc;
    }
    if (isObject(ptr) && typeof key === "string") {
      ptr[key] = op.value;
      return this.doc;
    }
    throw getInvalidKeyError(opIndex, op, this.doc);
  }

  private copy(op: CopyOperation, opIndex: number) {
    // enforce copy by value so further operations don't affect source
    const value = structuredClone(this.getValueByPointer(op.from, opIndex));
    this.applyOperation({ op: "add", path: op.path, value }, opIndex);
    return this.doc;
  }

  private _get(op: GetOperation, ptr: Doc, key: Key, opIndex: number) {
    if (Array.isArray(ptr) && typeof key === "number") {
      op.value = ptr[key];
      return this.doc;
    }
    if (isObject(ptr) && typeof key === "string") {
      op.value = ptr[key];
      return this.doc;
    }
    throw getInvalidKeyError(opIndex, op, this.doc);
  }

  private getValueByPointer(pointer: string, opIndex: number) {
    if (pointer === "") {
      return this.doc;
    }
    const op = <GetOperation>{ op: "_get", path: pointer };
    this.applyOperation(op, opIndex);
    return op.value;
  }

  private test(op: TestOperation, ptr: unknown, opIndex: number) {
    if (areEquals(ptr, op.value)) {
      return this.doc;
    }
    throw new TestFailError({
      message: `Test operation '${opIndex}' value isn't equal to the expected value`,
      operation: op,
      operationIndex: opIndex,
      doc: this.doc
    });
  }
}

type Options = {
  mutate?: boolean;
};

/**
 * Applies an array of operations to a JSON document.
 *
 * Modifies the `doc` in place if `mutate` is true. Otherwise, returns a deep copy with the changes applied.
 *
 * @template T The type of the resulting patched document.
 * @param doc - The document to patch.
 * @param operations - The list of operations to apply.
 * @param opts - Optional settings.
 * @param opts.mutate - If true, directly modifies the input document (default: false).
 * @returns The updated document (same reference if `mutate` is true, otherwise a new copy).
 */
function applyOperations<T = unknown>(doc: Doc, operations: ReadonlyArray<Operation>, opts: Options = {}): T {
  const mutate = opts.mutate || false;
  const patcher = new Patcher(doc, mutate);
  for (let i = 0; i < operations.length; i++) {
    patcher.applyOperation(operations[i], i);
  }
  return patcher.get() as T;
}

export default applyOperations;

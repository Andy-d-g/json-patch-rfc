import applyOperations from "./apply";
import type { Doc } from "./doc";
import { InvalidValueType } from "./error";
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

function getParentPath(path: string): string {
  const segments = path.split("/");

  if (segments.length <= 2) return ""; // root or top-level path

  return segments.slice(0, -1).join("/");
}

function resolveDashPath<T extends Doc>(doc: T, op: AddOperation | CopyOperation): string {
  const segments = op.path.split("/");
  const last = segments.at(-1);

  if (last !== "-") return op.path;

  const parentPath = getParentPath(op.path);
  const getParent: GetOperation = { op: "_get", path: parentPath, value: undefined };
  applyOperations(doc, [getParent]);

  const parent = getParent.value;

  if (!Array.isArray(parent)) {
    throw new InvalidValueType({
      message: "'-' is only supported when parent is an array",
      doc,
      operation: op,
      operationIndex: 0
    });
  }

  // Replace "-" with correct index: `length` for add, `length - 1` for copy
  const index = op.op === "add" ? parent.length : parent.length - 1;
  segments[segments.length - 1] = index.toString();

  return segments.join("/");
}

class Reverter<T extends Doc> {
  constructor(private doc: T) {}

  revert(op: Operation): Operation[] {
    switch (op.op) {
      case "test":
        return [this.revertTest(op)];
      case "_get":
        return [this.revertGet(op)];
      case "add":
        return [this.revertAdd(op)];
      case "remove":
        return [this.revertRemove(op)];
      case "copy":
        return [this.revertCopy(op)];
      case "replace":
        return [this.revertReplace(op)];
      case "move":
        return this.revertMove(op);
    }
  }

  private revertGet(op: GetOperation): GetOperation {
    return { op: "_get", path: op.path, value: undefined };
  }

  private revertTest(op: TestOperation): TestOperation {
    return { op: op.op, path: op.path, value: structuredClone(op.value) };
  }

  private revertAdd(op: AddOperation): RemoveOperation {
    return { op: "remove", path: resolveDashPath(this.doc, op) };
  }

  private revertCopy(op: CopyOperation): RemoveOperation {
    return { op: "remove", path: resolveDashPath(this.doc, op) };
  }

  private revertRemove(op: RemoveOperation): AddOperation {
    const get: GetOperation = { op: "_get", path: op.path, value: undefined };
    applyOperations(this.doc, [get]);
    return { op: "add", path: op.path, value: get.value };
  }

  private revertReplace(op: ReplaceOperation): ReplaceOperation {
    const get: GetOperation = { op: "_get", path: op.path, value: undefined };
    applyOperations(this.doc, [get]);
    return { op: "replace", path: op.path, value: get.value };
  }

  // ⚠️ Dirty code
  private revertMove(op: MoveOperation): Operation[] {
    const ops = Array.of<Operation>();

    const getFromParent: GetOperation = { op: "_get", path: getParentPath(op.from), value: undefined };
    const getPathParent: GetOperation = { op: "_get", path: getParentPath(op.path), value: undefined };
    const getFrom: GetOperation = { op: "_get", path: op.from, value: undefined };
    const getPath: GetOperation = { op: "_get", path: op.path, value: undefined };

    applyOperations(this.doc, [getFrom, getPath, getFromParent, getPathParent]);

    const fromParentIsArray = Array.isArray(getFromParent.value);
    const pathParentIsArray = Array.isArray(getPathParent.value);
    const fromIsArray = Array.isArray(getFrom.value);
    const pathIsArray = Array.isArray(getPath.value);

    if (!fromParentIsArray && !pathParentIsArray && !pathIsArray && !fromIsArray) {
      if (getPath.value) {
        ops.push({ op: "replace", path: op.path, value: getPath.value });
      } else {
        ops.push({ op: "remove", path: op.path });
      }
      ops.push({ op: "replace", path: op.from, value: getFrom.value });
      return ops;
    }
    if (!fromParentIsArray && !pathParentIsArray && !pathIsArray && fromIsArray) {
      ops.push({ op: "replace", path: op.path, value: getPath.value });
      ops.push({ op: "add", path: op.from, value: getFrom.value });
      return ops;
    }
    if (!fromParentIsArray && pathParentIsArray && !pathIsArray && !fromIsArray) {
      const npath = op.path.split("/");
      if (npath.at(-1) === "-") {
        npath.pop();
        npath.push((getPathParent.value as unknown[]).length.toString());
      }
      ops.push({ op: "remove", path: npath.join("/") });
      ops.push({ op: "add", path: op.from, value: getFrom.value });
      return ops;
    }
    if (fromParentIsArray && pathParentIsArray && !pathIsArray && !fromIsArray) {
      ops.push({ op: "remove", path: op.path });
      ops.push({ op: "add", path: op.from, value: getFrom.value });
      return ops;
    }
    if (fromParentIsArray && !pathParentIsArray && pathIsArray && !fromIsArray) {
      ops.push({ op: "replace", path: op.path, value: getPath.value });
      ops.push({ op: "add", path: op.from, value: getFrom.value });
      return ops;
    }
    if (fromParentIsArray && !pathParentIsArray && !pathIsArray && !fromIsArray) {
      const path = getPath.path.split("/");
      const from = getFrom.path.split("/");

      let i = 0;
      for (; i < from.length; i++) {
        if (path[i] !== from[i]) break;
      }
      const pathKey = Number(path[i]);
      const fromKey = Number(from[i]);

      const nPath = [...path];
      let sameRoot = false;

      if (Number.isInteger(fromKey) && Number.isInteger(pathKey) && fromKey < pathKey) {
        nPath[i] = `${pathKey + 1}`;
        sameRoot = true;
      }

      const getnPath: GetOperation = { op: "_get", path: nPath.join("/"), value: undefined };

      applyOperations(this.doc, [getnPath]);

      if (sameRoot) {
        ops.push({ op: "replace", path: getPath.path, value: getnPath.value });
      } else {
        const npath = getPath.path.split("/");
        if (npath.at(-1) === "-") {
          npath[npath.length - 1] = (getPath.value as unknown[]).length.toString();
        }
        ops.push({ op: "remove", path: npath.join("/") });
      }
      ops.push({ op: "add", path: op.from, value: getFrom.value });
      return ops;
    }

    return ops;
  }
}

function revertOperations<T extends Doc>(doc: T, ops: ReadonlyArray<Operation>): Operation[][] {
  const revertOps = Array.of<Operation[]>();
  const copy = structuredClone(doc);
  const reverter = new Reverter(copy);
  for (const op of structuredClone(ops)) {
    const revertOp = reverter.revert(op);
    revertOps.push(revertOp);
    applyOperations(copy, [op], { mutate: true });
  }
  // Because we cancel so we start by the end
  return revertOps.toReversed();
}

export default revertOperations;

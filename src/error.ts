import type { Operation } from "./operations";

type ErrorOptions = {
  message: string;
  operation: Operation;
  operationIndex: number;
  doc: unknown;
};

function formatError(message: String, args: Record<string, unknown>): string {
  const messageParts = [message];
  for (const key in args) {
    const value = typeof args[key] === "object" ? JSON.stringify(args[key], null, 2) : args[key]; // pretty print
    if (typeof value !== "undefined") {
      messageParts.push(`${key}: ${value}`);
    }
  }
  return messageParts.join("\n");
}

class OperationError extends Error {
  operation: Operation;
  operationIndex: number;
  doc: unknown;

  constructor(opts: ErrorOptions) {
    const { message, operation, operationIndex, doc } = opts;
    super(formatError(message, { operation, operationIndex, doc }));
    // restore prototype chain, see https://stackoverflow.com/a/48342359
    Object.setPrototypeOf(this, new.target.prototype);
    this.doc = doc;
    this.operation = operation;
    this.operationIndex = operationIndex;
  }
}

export class UnknownOperationError extends OperationError {}
export class UnresolvablePathError extends OperationError {}
export class InvalidKeyError extends OperationError {}
export class TestFailError extends OperationError {}
export class InvalidValueType extends OperationError {}

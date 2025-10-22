import type { Operation } from "./operations";

/** Options for constructing an OperationError. */
type ErrorOptions = {
  /** Error message. */
  message: string;
  /** The JSON Patch operation causing the error. */
  operation: Operation;
  /** Index of the operation in the operations array. */
  operationIndex: number;
  /** The document being patched when the error occurred. */
  doc: unknown;
};

/**
 * Formats an error message with additional context.
 *
 * @param message - The main error message.
 * @param args - Additional details to include in the message.
 * @returns The formatted error string.
 */
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

/**
 * Base class for errors related to JSON Patch operations.
 */
class OperationError extends Error {
  /** The operation that caused the error. */
  operation: Operation;
  /** Index of the operation in the operations array. */
  operationIndex: number;
  /** The document being patched when the error occurred. */
  doc: unknown;

  /**
   * Creates a new OperationError.
   *
   * @param opts - Options describing the error context.
   */
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

/** Error thrown when an unknown or unsupported JSON Patch operation is encountered. */
export class UnknownOperationError extends OperationError {}

/** Error thrown when a JSON Pointer path cannot be resolved. */
export class UnresolvablePathError extends OperationError {}

/** Error thrown when an operation uses an invalid key. */
export class InvalidKeyError extends OperationError {}

/** Error thrown when a test operation fails. */
export class TestFailError extends OperationError {}

/** Error thrown when a value is of an invalid type for the operation. */
export class InvalidValueType extends OperationError {}

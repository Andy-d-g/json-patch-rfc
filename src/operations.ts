export type BaseOperation = {
  path: string;
};

export type AddOperation = BaseOperation & {
  op: "add";
  value: unknown;
};

export type RemoveOperation = BaseOperation & {
  op: "remove";
};

export type ReplaceOperation = BaseOperation & {
  op: "replace";
  value: unknown;
};

export type MoveOperation = BaseOperation & {
  op: "move";
  from: string;
};

export type CopyOperation = BaseOperation & {
  op: "copy";
  from: string;
};

export type TestOperation = BaseOperation & {
  op: "test";
  value: unknown;
};

export type GetOperation = BaseOperation & {
  op: "_get";
  value: unknown;
};

export type Operation =
  | AddOperation
  | RemoveOperation
  | ReplaceOperation
  | MoveOperation
  | CopyOperation
  | TestOperation
  | GetOperation;

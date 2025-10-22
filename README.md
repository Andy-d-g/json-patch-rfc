# json-patch-rfc

⚠️ Forked from fast-json-patch

Tiny, fast utilities fully compatible with RFC 6902 (JSON Patch).

- `compare` — compute a patch between **before** → **after**
- `revertOperations` — generate inverse ops for rollback
- `applyOperations` — apply a patch (immutable by default)
- Works in Node and the browser. TypeScript-ready.
- **ESM-only**; CJS is **not** supported.

## Why you should use JSON-Patch

JSON-Patch [(RFC6902)](http://tools.ietf.org/html/rfc6902) is a standard format that
allows you to update a JSON document by sending the changes rather than the whole document.
JSON Patch plays well with the HTTP PATCH verb (method) and REST style programming.

Mark Nottingham has a [nice blog]( http://www.mnot.net/blog/2012/09/05/patch) about it.

## Commands
```bash
# install
pnpm install

# build
pnpm build

# test
pnpm test
```

## How to use

### `compare(from: Doc, dest: Doc): Operation[]`

Generates a patch that transforms the document `from` into the document `dest`.
```ts
import { compare } from "json-patch-rfc";

const from = { theme: "light", tags: ["dev"] };
const dest = { theme: "dark", tags: ["dev", "ai"] };

const ops = compare(from, dest);
/*
[
  { op: "replace", path: "/theme", value: "dark" },
  { op: "add", path: "/tags/1", value: "ai" }
]
*/
```

### `revertOperations<T extends Doc>(doc: T, ops: Operation[]): Operation[][]`

Creates inverse operations for each operation in a patch. Useful to roll back changes step-by-step.
```ts
import { revertOperations, applyOperations } from "json-patch-rfc";

const doc = { counter: 0 };
const ops = [
  { op: "replace", path: "/counter", value: 1 }
];

const reverted = revertOperations(doc, ops);
/*
[ [{ op: "replace", path: "/counter", value: 0 }] ]
*/

const updated = applyOperations(doc, ops);
const rolledBack = applyOperations(updated, reverted.flat());
// rolledBack = { counter: 0 }
```

### `applyOperations<T>(doc: Doc, operations: ReadonlyArray<Operation>, opts?: { mutate?: boolean }): T`

Applies a sequence of operations to a document.

- By default: the doc will **not** be mutated. It will return a new doc.
- With `{ mutate: true }`: it modifies the doc.
```ts
import { applyOperations } from "json-patch-rfc";

const original = { name: "Ada" };
const ops = [{ op: "replace", path: "/name", value: "Ada Lovelace" }];

const updated = applyOperations(original, ops);
// updated = { name: "Ada Lovelace" }
// original remains unchanged
```
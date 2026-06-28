# jsdoc-scribe

Pure, deterministic, **AST-based** JSDoc comment generator for JavaScript & TypeScript.
**No AI / LLM is used anywhere** — every line of every comment is derived
mechanically from the syntax tree (names, modifiers, type annotations,
parameter lists, heritage clauses, enum members, etc). Same input always
produces the same output.

## Install

```bash
# run once without installing anything
npx jsdoc-scribe . --write

# or add it to your project
npm install --save-dev jsdoc-scribe

# or install it globally
npm install -g jsdoc-scribe
```

Once installed, the command is **`gen-comments`**.

## Usage

```bash
gen-comments <path> [path2 ...] [options]
```

`<path>` can be a single file **or a directory** — directories are scanned
recursively for `.js` / `.jsx` / `.ts` / `.tsx` files. `node_modules`, `.git`,
`dist`, `build`, `out`, `coverage`, `.next`, `.turbo`, `.cache`, and any other
dotfolder are skipped automatically.

| Flag | Description |
|---|---|
| `--write`, `-w` | Edit files **in place**. Without this flag, output goes to a sibling `<name>.commented.<ext>` file next to each original, so you can review a diff before committing to it. |
| `--force`, `-f` | Re-insert comment blocks even on nodes that already have a leading `/** */`. Off by default, to stay idempotent. |
| `--help`, `-h` | Show usage. |
| `--version`, `-v` | Show the installed version. |

```bash
gen-comments src/utils.ts                  # preview only -> utils.commented.ts
gen-comments .                              # scan whole project, preview only
gen-comments . --write                      # scan whole project, edit in place
gen-comments src --write --force            # also re-document already-commented files
```

If you run `--write` outside a git repo, the CLI prints a one-line warning
(not a blocker) recommending you commit first so you have something to diff
or revert against.

## The algorithm

1. **Parse** each file into a `ts.SourceFile` AST using the TypeScript
   compiler's parser (`typescript` npm package). That parser is syntax-only —
   it never type-checks — and it's a superset parser for JavaScript, which is
   why this works on plain `.js`/`.jsx` just as well as `.ts`/`.tsx`.
2. **Walk** the AST recursively. Tracked node kinds:
   - `FunctionDeclaration` (top-level or nested)
   - `ClassDeclaration` + its `constructor` / methods / properties / get-set
   - `VariableStatement` (`const`/`let`/`var`, including arrow/function inits)
   - `PropertyAssignment` with a function/arrow value inside an object literal
   - `InterfaceDeclaration`, `TypeAliasDeclaration`, `EnumDeclaration`
3. **Skip** any node that already has a leading `/** ... */` block — unless
   `--force` is passed. This keeps the tool idempotent: running it twice
   never duplicates comments.
4. **Build** the comment block from pure syntax only:
   - An explicit type annotation is always used as-is.
   - With no annotation, it falls back to a syntactic guess: literal kind for
     variables (`'x'` → `string`, `[1,2]` → `Array`, …), and for function
     return types, a scan for a top-level `return <value>;` (so a function
     that clearly returns something is never mislabeled `void` just because
     it lacks a type annotation).
   - Modifiers (`async`, `static`, `private`, `readonly`, `abstract`,
     `export`, generator `*`) are read directly off the AST node.
5. **Insert** the comment as plain text at the exact byte offset where the
   node's own line indentation begins. All edits are collected first, then
   applied bottom-to-top so earlier offsets never shift — the rest of the
   file is never re-printed or reformatted, only insertions happen.
6. **Write** the result — to `<file>.commented.<ext>` by default, or back to
   the original file with `--write`.

## Using it as a library

```js
const { processFile, collectFiles } = require('jsdoc-scribe');

// process one file, return number of comment blocks added
processFile('src/utils.ts', { write: true });

// recursively find every matching source file under a directory
const files = collectFiles('src');
```

## Known scope / limitations (by design)

- Inline anonymous callbacks passed directly as call arguments
  (`arr.map(x => x * 2)`) are **not** commented — inserting a multi-line block
  there would mangle the call expression. Anything with its own declaration
  (function decl, class member, variable, named object property) is covered.
- Type/return inference is 100% syntactic. It is never "smart" about what
  your code *means* — only what it *looks like* structurally.
- Multi-declarator statements (`const a = 1, b = 2;`) get one combined block
  rather than a per-declarator function-style doc.
- `.d.ts` files are skipped (no implementation to document).

## License

MIT
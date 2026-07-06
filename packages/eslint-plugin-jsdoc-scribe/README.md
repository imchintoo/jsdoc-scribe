# eslint-plugin-jsdoc-scribe

JSDoc validation rules for ESLint, powered by [jsdoc-scribe](https://github.com/imchintoo/jsdoc-scribe)'s
native lint engine. Flat config only. 10 of 12 rules are autofixable
(`eslint --fix`). No legacy `.eslintrc` support yet — see
[Scope and limitations](#scope-and-limitations) below.

This package exists so teams who already run ESLint can enforce — and now fix — the exact
same JSDoc rules jsdoc-scribe's own `--lint`/`--lint --fix` CLI flags ship, inside their
normal `eslint`/`eslint --fix` run, without a second CLI to wire into CI.

## Install

```bash
npm install --save-dev eslint-plugin-jsdoc-scribe
```

Requires `eslint@>=9.0.0` (flat config).

## Usage

`eslint.config.js`:

```js
const jsdocScribe = require("eslint-plugin-jsdoc-scribe");

module.exports = [
    jsdocScribe.configs.recommended,
];
```

Or pick rules individually:

```js
const jsdocScribe = require("eslint-plugin-jsdoc-scribe");

module.exports = [
    {
        plugins: { "jsdoc-scribe": jsdocScribe },
        rules: {
            "jsdoc-scribe/require-jsdoc": "error",
            "jsdoc-scribe/require-param": "error",
            "jsdoc-scribe/check-tag-names": "error",
        },
    },
];
```

Run `eslint --fix` as usual to apply every fixable finding in one pass.

## Rules

| Rule | What it checks | Fixable |
|---|---|---|
| `require-jsdoc` | Functions, `const fn = () => {}` / `function(){}`, classes, and non-accessor methods must have a leading JSDoc block. | No — adding a brand-new block isn't this plugin's job |
| `require-param` | Every function parameter has a matching `@param`. | Yes |
| `require-param-description` | Every `@param` has a description. | Yes |
| `check-param-names` | `@param` order matches the function's actual parameter order (only checked when the name sets match exactly). | Yes |
| `require-returns` | A function whose body returns a value has a `@returns` tag. | Yes |
| `require-returns-description` | `@returns` has a description. | Yes |
| `require-returns-check` | `@returns` isn't present on a function that never returns a value. | Yes |
| `require-description` | Every JSDoc block has a description, not just tags. | Yes |
| `check-tag-names` | Every `@tag` is a recognized JSDoc/TypeScript-flavor tag, not a typo. | No — see below |
| `empty-tags` | Tags that should never carry trailing text (`@readonly`, `@private`, etc.) don't have any. | Yes |
| `no-multi-asterisks` | No stray `**` at the start of an interior comment line. | Yes |
| `no-blank-block-descriptions` | A JSDoc block isn't completely empty (`/**\n */` with nothing in it). | Yes |

These are the same 12 rule names `jsdoc-scribe --lint` validates. One CLI rule,
`no-bad-blocks`, is **not** included here — it depends on jsdoc-scribe's TypeScript-Compiler-API
malformed-comment detection, which has no equivalent in ESLint's own comment/AST model.

`require-returns` and `require-returns-check` differ from the CLI in one respect: the CLI reads a
TypeScript return-type annotation to decide whether a function "really" returns a value; this
plugin (which also targets plain `.js` files, with no type-checker available) infers it from the
function body instead, by checking whether the body contains a `return <expr>;`.

## Autofix (`eslint --fix`)

Ten of the twelve rules ship a real ESLint fixer. Two strategies, matched to what's being
fixed:

- **Function-like rules** (`require-param` through `require-description`) do a full rebuild
  of the JSDoc block from the real function signature — real parameter names and order,
  whether the function actually returns a value — merged with whatever valid prose already
  existed. A block with no lint issues is never touched.
- **Text-level rules** (`empty-tags`, `no-multi-asterisks`, `no-blank-block-descriptions`)
  apply a small, targeted line edit: strip trailing text, collapse stray asterisks, insert
  one placeholder line into a blank block.

A missing description (block, `@param`, or `@returns`) is filled with a fixed, deterministic
placeholder — never invented prose:

```
TODO: describe what this does.
TODO: describe parameter "name".
TODO: describe the return value.
```

Same text every time for the same kind of gap, and unmistakably marked so you immediately
know it needs a real description — `grep -r "TODO: describe"` finds every one the fixer has
left behind. This is the one place these rules write prose instead of a mechanical
transform; see
[`docs/backlog/adr-013-lint-autofix.md`](../../docs/backlog/adr-013-lint-autofix.md) in the
main repo for the full reasoning.

**What autofix deliberately doesn't do:**

- **`require-jsdoc` has no fixer.** Inserting a brand-new JSDoc block isn't this plugin's
  job — use jsdoc-scribe's own `gen-comments --write` for that.
- **`check-tag-names` has no fixer, ever.** An unknown/typo'd tag (e.g. `@parm`) has no safe
  default to rename it to — guessing the author's intent would be a real departure from
  "no AI, no guessing," unlike the fixed placeholder templates above. This finding always
  survives `eslint --fix`.
- **A stale `@param`/`@returns`** that no longer matches the real signature is left
  untouched by these fixers (carried through as-is) — that's outside this rule set's scope.

Plain ESTree carries no type annotations, so a brand-new `@param` with no prior documented
type gets `{*}` (JSDoc/Closure's own "any type" marker) rather than a TypeScript-inferred
one — still deterministic, just a different type source than the CLI has available.

## Scope and limitations

- **Flat config only.** No `.eslintrc` / `eslintrc.json` support in this version. ESLint 9+
  defaults to flat config, and shipping both configs half-verified was judged worse than shipping
  one, fully verified. Legacy config support is a tracked fast-follow, not silently dropped.
- **JS-focused.** Rules operate on ESLint's own ESTree AST via `context.sourceCode`, so anything
  ESLint's configured parser understands (plain JS, JSX, and TS if you add
  `@typescript-eslint/parser`) is covered — but scope inspection (`require-jsdoc`, etc.) targets
  functions, classes, and non-accessor methods only, not TS-only constructs like interfaces or type
  aliases (those already have deterministic coverage via jsdoc-scribe's own `--check`/`--lint` CLI
  flags, which parse TypeScript directly).

## Relationship to jsdoc-scribe

This package is a separate, independently versioned npm package that depends on `jsdoc-scribe`
(never the reverse). It reuses `jsdoc-scribe`'s `KNOWN_TAGS`/`NO_DESC_TAGS` reference data via the
`jsdoc-scribe/lint` export subpath, but each rule's ESLint-side logic (including its fixer) is
natively implemented against ESTree — `jsdoc-scribe`'s own `lintModule()`/`fixModule()` operate on
TypeScript-Compiler-API data and can't run directly against ESLint's AST shape. See
[`docs/backlog/adr-012-eslint-plugin-package.md`](../../docs/backlog/adr-012-eslint-plugin-package.md)
and [`docs/backlog/adr-013-lint-autofix.md`](../../docs/backlog/adr-013-lint-autofix.md)
in the main repo for the full architecture decisions.

## License

MIT

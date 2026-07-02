# jsdoc-scribe

[![npm version](https://img.shields.io/npm/v/jsdoc-scribe.svg)](https://www.npmjs.com/package/jsdoc-scribe)
[![npm downloads](https://img.shields.io/npm/dm/jsdoc-scribe.svg)](https://www.npmjs.com/package/jsdoc-scribe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/jsdoc-scribe.svg)](https://nodejs.org)

> Pure, deterministic, **AST-based** JSDoc comment generator and multi-page documentation site builder for JavaScript & TypeScript.
> **No AI. No LLM. No surprises.** Same input always produces the same output.

Two CLIs, one dependency (`typescript`, used purely as a syntax parser):

| Tool | What it does |
|---|---|
| `gen-comments` | Inserts `/** */` JSDoc blocks into your source by reading the AST — no guessing |
| `gen-docs` | Builds a static, multi-page HTML documentation site from your documented source |

---

## Preview

![jsdoc-scribe docs preview](https://raw.githubusercontent.com/imchintoo/jsdoc-scribe/main/assets/preview.svg)

Sticky topnav with centered search, white sidebar with an N-level folder tree, two-column symbol cards (prose left / dark code panel right), and a scroll-spy TOC on module pages.

---

## Benchmarks

Measured directly against the CLIs, single Node process, no caching between runs.

| Source size | `gen-comments --dry-run` | `gen-docs` (single file) |
|---|---|---|
| 231 LOC | 1.15s · 96 MB | 0.49s · 94 MB |
| 2.3K LOC | 0.66s · 108 MB | 0.39s · 104 MB |
| 23K LOC | 1.47s · 167 MB | 0.71s · 155 MB |
| 117K LOC | 2.50s · 311 MB | 1.39s · 269 MB |
| 233K LOC | 4.17s · 345 MB | 2.29s · 445 MB |

Real multi-file project (1,000 files, 70K total LOC): `gen-comments --write` finishes in **1.03s at 115 MB**. Both CLIs scale close to linearly with source size — the ~300-500ms floor at small sizes is Node + TypeScript-parser startup, not per-line work.

One known ceiling: `gen-docs` site generation slows superlinearly past ~300-500 source files (traced to redundant path-prefix recomputation in the sidebar/label logic) — tracked for a fix, see [Known limitations](#known-limitations).

---

## Install

```bash
npx jsdoc-scribe . --write            # run once, no install
npm install --save-dev jsdoc-scribe   # add to project
npm install -g jsdoc-scribe           # or install globally
```

---

## `gen-comments` — add JSDoc to source

```bash
gen-comments <path> [path2 ...] [options]
```

`<path>` can be a file or directory (scanned recursively; `node_modules`, `dist`, `build`, `.git`, dotfolders auto-skipped). Idempotent — a second run adds zero blocks. Nodes with an existing `/** */` block are left untouched unless `--force`.

```ts
// before
export async function login(username: string, password: string): Promise<User> {
    const user = await db.findByUsername(username);
    if (!user) throw new AuthError("Invalid credentials");
    return user;
}

// after: gen-comments src/auth.ts --write
/**
 * @async
 * @param {string} username
 * @param {string} password
 * @returns {Promise<User>}
 */
export async function login(username: string, password: string): Promise<User> {
    const user = await db.findByUsername(username);
    if (!user) throw new AuthError("Invalid credentials");
    return user;
}
```

Purely syntactic — explicit type annotations are used verbatim; without them, the tool infers from literal shape (`'x'` → `string`) and scans for a top-level `return <value>` statement. No type-checking, no evaluation.

### Flags

| Flag | Short | Description |
|---|---|---|
| `--write` | `-w` | Edit files in place (otherwise writes a sibling `<name>.out.<ext>` for review). |
| `--force` | `-f` | Re-insert blocks even where one already exists. |
| `--dry-run` | `-n` | Preview only, no writes. |
| `--check` | `-C` | Like `--dry-run`, exits `1` if anything's undocumented. CI coverage gate. |
| `--check-drift` | | Compares existing JSDoc against the current AST — flags missing/removed params and return-type mismatches. Read-only, exits `1` on drift. |
| `--coverage-badge <dir>` | | Writes an offline `coverage-badge.svg` + `coverage-summary.json` to `<dir>`. No network calls. |
| `--help` / `--version` | `-h` / `-v` | |

```bash
gen-comments src --write --force            # re-document already-commented files
gen-comments src --check                    # CI gate: undocumented symbols
gen-comments src --check-drift              # CI gate: JSDoc drifted from AST
gen-comments src --coverage-badge docs      # docs/coverage-badge.svg + coverage-summary.json
```

> Commit before running `--write` — the CLI warns if you're outside a git repo.

---

## `gen-docs` — build a documentation site

```bash
gen-docs src --out docs --title "My Project"
# open docs/index.html
```

Self-contained static output, no server required:

```
docs/
  index.html            # module index
  search-index.js       # client-side search
  assets/{style.css,app.js}
  modules/*.html
```

### Flags

| Flag | Short | Description |
|---|---|---|
| `--out <dir>` | `-o` | Output directory (default `docs`). |
| `--title <name>` | `-t` | Site title. |
| `--json` | `-j` | Also write `docs.json`. |
| `--readme` | `-r` | Also write a markdown table README. |
| `--source-url <url>` | `-s` | GitHub blob base URL — adds per-card "line N" source links. |
| `--ignore <glob>` | `-I` | Exclude glob, repeatable. |
| `--config <file>` | `-c` | Path to `.jsdoc-scribe.json`. |
| `--watch` | `-W` | Rebuild on file change (150ms debounce). |
| `--help` / `--version` | `-h` / `-v` | |

### Config file (`.jsdoc-scribe.json`)

```json
{
  "out": "docs",
  "title": "My Project",
  "sourceUrl": "https://github.com/org/repo/blob/main",
  "ignore": ["**/internal/**", "**/*.test.ts"]
}
```

CLI flags override config values.

---

## Programmatic API

```js
const { generateSite } = require('jsdoc-scribe/docs');
const fs = require('fs'), path = require('path');

const pages = generateSite(['src'], { projectName: 'My Project', version: '1.0.0' });
for (const p of pages) {
  const dest = path.join('docs', p.path);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, p.html, 'utf8');
}
```

Also exported: `collectFiles`, `extractModule`, `extractModules`, `buildSite`, `moduleLabel`, `moduleHtmlPath`. `extractModule(filePath)` returns `{ filePath, description, functions[], classes[], interfaces[], typeAliases[], enums[], variables[] }` — each entry carries both the AST-inferred shape (`params`, `returnType`) and the parsed JSDoc (`jsdocParams`, `returns`, `throws`, `since`, `deprecated`).

---

## CI — auto-deploy docs to GitHub Pages

```yaml
# .github/workflows/docs.yml
name: Deploy docs
on: { push: { branches: [main] } }
permissions: { contents: read, pages: write, id-token: write }
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: ${{ steps.deployment.outputs.page_url }} }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx gen-docs src --out _site --title "${{ github.event.repository.name }}" --source-url "https://github.com/${{ github.repository }}/blob/main" --json
      - uses: actions/upload-pages-artifact@v3
        with: { path: _site }
      - id: deployment
        uses: actions/deploy-pages@v4
```

Enable GitHub Pages (Settings → Pages → Source: GitHub Actions).

---

## Known limitations

- Inline anonymous callbacks (`arr.map(x => x * 2)`) aren't documented — named declarations only.
- Type inference is 100% syntactic — no evaluation, no imports, no type-checking.
- Multi-declarator statements (`const a = 1, b = 2;`) get one combined block.
- `.d.ts` files are skipped.
- `gen-docs` doesn't serve — use `npx serve docs` or deploy statically.
- `gen-docs` site generation degrades superlinearly past ~300-500 source files (redundant per-page path-prefix recomputation) — fix in progress, tracked in `docs/backlog/`.

See [CHANGELOG.md](./CHANGELOG.md) for release history.

---

## License

MIT © [Chintan](https://github.com/imchintoo)

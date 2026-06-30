# jsdoc-scribe

[![npm version](https://img.shields.io/npm/v/jsdoc-scribe.svg)](https://www.npmjs.com/package/jsdoc-scribe)
[![npm downloads](https://img.shields.io/npm/dm/jsdoc-scribe.svg)](https://www.npmjs.com/package/jsdoc-scribe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/jsdoc-scribe.svg)](https://nodejs.org)

> Pure, deterministic, **AST-based** JSDoc comment generator and multi-page documentation site builder for JavaScript & TypeScript.  
> **No AI. No LLM. No surprises.** Same input always produces the same output.

---

## What it does

`jsdoc-scribe` ships two independent CLI tools:

| Tool | What it does |
|---|---|
| `gen-comments` | Inserts `/** */` JSDoc blocks into your source files by reading the AST — no AI, no guessing |
| `gen-docs` | Generates a multi-page HTML documentation site from your already-documented source |

---

## Table of contents

- [Install](#install)
- [gen-comments — Add JSDoc to source files](#gen-comments--add-jsdoc-to-source-files)
  - [Before / after example](#before--after-example)
  - [CLI flags](#cli-flags)
  - [How the algorithm works](#how-the-algorithm-works)
- [gen-docs — Build a documentation site](#gen-docs--build-a-documentation-site)
  - [Quick start](#quick-start)
  - [CLI flags](#cli-flags-1)
  - [Config file](#config-file)
  - [Themes](#themes)
  - [Source links](#source-links)
  - [Ignore patterns](#ignore-patterns)
  - [Watch mode](#watch-mode)
- [Programmatic API](#programmatic-api)
- [GitHub Actions — auto-deploy docs](#github-actions--auto-deploy-docs)
- [Known limitations](#known-limitations)
- [License](#license)

---

## Install

```bash
# run once without installing
npx jsdoc-scribe . --write

# add to your project
npm install --save-dev jsdoc-scribe

# or install globally
npm install -g jsdoc-scribe
```

---

## gen-comments — Add JSDoc to source files

`gen-comments` walks your source tree, parses every `.js` / `.jsx` / `.ts` / `.tsx` file with the TypeScript compiler's AST parser, and inserts `/** */` blocks for every undocumented function, class, method, interface, enum, type alias, and variable.

### Before / after example

**Before** — a plain TypeScript file with no documentation:

```ts
// src/auth.ts

export async function login(username: string, password: string): Promise<User> {
    const user = await db.findByUsername(username);
    if (!user || !verify(password, user.passwordHash)) {
        throw new AuthError("Invalid credentials");
    }
    return user;
}

export class TokenService {
    private readonly secret: string;

    constructor(secret: string) {
        this.secret = secret;
    }

    sign(payload: Record<string, unknown>, expiresIn = "1h"): string {
        return jwt.sign(payload, this.secret, { expiresIn });
    }

    verify(token: string): Record<string, unknown> | null {
        try {
            return jwt.verify(token, this.secret) as Record<string, unknown>;
        } catch {
            return null;
        }
    }
}

export type AuthRole = "admin" | "editor" | "viewer";

export enum Permission {
    Read = "read",
    Write = "write",
    Delete = "delete",
}
```

**After** — run `gen-comments src/auth.ts --write`:

```ts
// src/auth.ts

/**
 * @async
 * @param {string} username
 * @param {string} password
 * @returns {Promise<User>}
 */
export async function login(username: string, password: string): Promise<User> {
    const user = await db.findByUsername(username);
    if (!user || !verify(password, user.passwordHash)) {
        throw new AuthError("Invalid credentials");
    }
    return user;
}

/**
 * @class TokenService
 */
export class TokenService {
    /** @type {string} */
    private readonly secret: string;

    /**
     * @constructor
     * @param {string} secret
     */
    constructor(secret: string) {
        this.secret = secret;
    }

    /**
     * @param {Record<string, unknown>} payload
     * @param {string} [expiresIn]
     * @returns {string}
     */
    sign(payload: Record<string, unknown>, expiresIn = "1h"): string {
        return jwt.sign(payload, this.secret, { expiresIn });
    }

    /**
     * @param {string} token
     * @returns {Record<string, unknown> | null}
     */
    verify(token: string): Record<string, unknown> | null {
        try {
            return jwt.verify(token, this.secret) as Record<string, unknown>;
        } catch {
            return null;
        }
    }
}

/**
 * @typedef {"admin" | "editor" | "viewer"} AuthRole
 */
export type AuthRole = "admin" | "editor" | "viewer";

/**
 * @enum {string}
 */
export enum Permission {
    Read = "read",
    Write = "write",
    Delete = "delete",
}
```

> The tool is **idempotent** — running it a second time adds zero blocks.  
> Nodes that already have a `/** */` block are never touched unless you pass `--force`.

### CLI flags

```bash
gen-comments <path> [path2 ...] [options]
```

`<path>` can be a file or directory. Directories are recursively scanned. `node_modules`, `dist`, `build`, `.git`, and all dotfolders are skipped automatically.

| Flag | Short | Description |
|---|---|---|
| `--write` | `-w` | Edit files **in place**. Without this flag, output goes to a sibling `<name>.out.<ext>` file so you can review the diff first. |
| `--force` | `-f` | Re-insert blocks even on nodes that already have `/** */`. Useful for regenerating stale docs. |
| `--help` | `-h` | Show usage. |
| `--version` | `-v` | Show installed version. |

```bash
gen-comments src/utils.ts                # preview → writes utils.out.ts
gen-comments .                           # scan whole project, preview only
gen-comments . --write                   # scan and edit in place
gen-comments src --write --force         # also re-document already-commented files
```

> **Tip:** Commit your changes before running `--write`. The CLI reminds you if you're outside a git repo.

### How the algorithm works

1. **Parse** — uses `typescript` (the npm package) purely as a syntax parser. Works on `.js`/`.jsx` as well as `.ts`/`.tsx`. No type-checking, no compilation.
2. **Walk** — visits `FunctionDeclaration`, `ClassDeclaration` (+ constructor / methods / properties / accessors), `VariableStatement` (including arrow functions and const objects), `InterfaceDeclaration`, `TypeAliasDeclaration`, `EnumDeclaration`.
3. **Skip** — any node with an existing leading `/** */` block is left untouched (unless `--force`).
4. **Build** — the comment block is built purely from syntax:
   - Explicit type annotations are used verbatim.
   - Without annotations, the tool infers from syntax: literal kind for variables (`'x'` → `string`, `[1,2]` → `Array`), and for function returns it scans for a top-level `return <value>` statement.
   - Modifiers (`async`, `static`, `private`, `readonly`, `abstract`, `export`, generator `*`) are read from the AST.
5. **Insert** — edits are collected and applied bottom-to-top so no byte offset shifts, and the rest of the file is never reprinted.

---

## gen-docs — Build a documentation site

`gen-docs` reads your source files (or an entire directory), extracts the public API using the same AST engine, and outputs a multi-page HTML documentation site with search, themes, source links, and cross-references.

### Quick start

```bash
# Generate docs for an entire directory
gen-docs src --out docs --title "My Project"

# Open docs/index.html in your browser
```

The output is a self-contained static site — no server required. Output structure:

```
docs/
  index.html          # project index (module cards)
  search-index.js     # shared search index (fetched once)
  assets/
    style.css         # shared CSS — cached after first page load
    app.js            # shared JS (search, theme toggle, copy)
  modules/
    api.html
    utils.html
    ...
```

### CLI flags

```bash
gen-docs <path> [path2 ...] [options]
```

| Flag | Short | Description |
|---|---|---|
| `--out <dir>` | `-o` | Output directory (default: `docs`). |
| `--title <name>` | `-t` | Site title shown in the header and `<title>` tag. |
| `--theme <name>` | `-T` | Visual theme: `default`, `minimal`, or `dark` (default: `default`). |
| `--json` | `-j` | Also write a `docs.json` machine-readable export. |
| `--readme` | `-r` | Also write a `README.md` with markdown tables of every module. |
| `--source-url <url>` | `-s` | GitHub base URL for per-card source links (e.g. `https://github.com/org/repo/blob/main`). |
| `--ignore <glob>` | `-I` | Glob pattern to exclude files. Repeatable. |
| `--config <file>` | `-c` | Path to a `.jsdoc-scribe.json` config file. |
| `--watch` | `-W` | Rebuild on file changes (150 ms debounce). |
| `--help` | `-h` | Show usage. |
| `--version` | `-v` | Show installed version. |

```bash
gen-docs src --out docs --title "My API"
gen-docs src --theme dark --source-url https://github.com/org/repo/blob/main
gen-docs src --json --readme --out _site
gen-docs src --ignore "**/internal/**" --ignore "**/*.test.ts"
gen-docs src --watch
```

### Config file

Create `.jsdoc-scribe.json` in your project root to avoid repeating flags:

```json
{
  "out": "docs",
  "title": "My Project",
  "theme": "default",
  "json": true,
  "readme": false,
  "sourceUrl": "https://github.com/org/repo/blob/main",
  "ignore": [
    "**/internal/**",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

CLI flags always override config file values. Use `--config path/to/other.json` to point to a custom config path.

### Themes

| Theme | Description |
|---|---|
| `default` | Blue-accented light sidebar, light/dark toggle stored in `localStorage`. |
| `minimal` | Clean light-only layout, no toggle. |
| `dark` | Forced dark mode, no toggle. |

```bash
gen-docs src --theme minimal
gen-docs src --theme dark
```

### Source links

Pass a GitHub blob base URL and every documented symbol card gets a clickable "line N" link straight to the source:

```bash
gen-docs src \
  --source-url https://github.com/org/repo/blob/main \
  --out docs
```

Each card then shows `line 42 ↗` linking to `https://github.com/org/repo/blob/main/src/utils.ts#L42`.

### Ignore patterns

```bash
# Exclude test files and an entire folder
gen-docs src \
  --ignore "**/*.test.ts" \
  --ignore "**/*.spec.ts" \
  --ignore "**/internal/**"
```

Patterns support `**/` prefix and `*` wildcard. You can also specify them in `.jsdoc-scribe.json`.

### Watch mode

```bash
gen-docs src --out docs --watch
```

The site rebuilds whenever any matching source file changes. Useful during active development — just refresh the browser.

---

## Programmatic API

```js
const {
  collectFiles,
  extractModule,
  extractModules,
  buildSite,
  generateSite,
  moduleLabel,
  moduleHtmlPath,
  DEFAULT_EXTENSIONS,
  DEFAULT_IGNORE_DIRS,
} = require('jsdoc-scribe/docs');
```

### One-shot generation

```js
const { generateSite } = require('jsdoc-scribe/docs');
const fs = require('fs'), path = require('path');

const pages = generateSite(['src'], {
  projectName: 'My Project',
  version: '1.0.0',
});

// pages = [{ path: 'index.html', html }, { path: 'assets/style.css', html }, ...]
for (const p of pages) {
  const dest = path.join('docs', p.path);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, p.html, 'utf8');
}
```

### Step-by-step

```js
const { collectFiles, extractModules, buildSite } = require('jsdoc-scribe/docs');
const fs = require('fs');
const path = require('path');

// 1. Collect source files
const files = collectFiles(['src'], {
  extensions: ['.ts', '.tsx'],
  ignore: ['**/*.test.ts'],
});

// 2. Extract the API model
const modules = extractModules(files);

// 3. Inspect the model
modules.forEach(mod => {
  console.log(mod.filePath, {
    functions: mod.functions.length,
    classes:   mod.classes.length,
    description: mod.description,
  });
});

// 4. Build the HTML site
const pages = buildSite(modules, {
  title: 'My Project',
  theme: 'dark',
  sourceUrl: 'https://github.com/org/repo/blob/main',
});

// 5. Write all files
// pages = [{ path, html }] and includes HTML pages + shared assets:
//   assets/style.css, assets/app.js, search-index.js
// Always use mkdirSync so assets/ and modules/ are created automatically.
const outDir = 'docs';
for (const p of pages) {
  const dest = path.join(outDir, p.path);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, p.html, 'utf8');
}
```

### Extracted module shape

Each module object returned by `extractModule(filePath)` has this structure:

```ts
{
  filePath: string;
  description: string | null;   // top-of-file @module description
  since: string | null;         // @since from top-of-file block
  functions: Array<{
    name: string;
    params: Array<{ name: string; type: string; optional: boolean }>;
    returnType: string;
    isAsync: boolean;
    isExported: boolean;
    line: number;               // 1-based line number
    description: string | null;
    jsdocParams: Array<{ name: string; type: string; description: string }>;
    returns: { type: string; description: string } | null;
    throws: Array<{ type: string; description: string }>;
    since: string | null;
    deprecated: string | null;
  }>;
  classes: Array<{ name: string; methods: [...]; properties: [...]; ... }>;
  interfaces: Array<{ ... }>;
  typeAliases: Array<{ ... }>;
  enums: Array<{ ... }>;
  variables: Array<{ ... }>;
}
```

---

## GitHub Actions — auto-deploy docs

Add this workflow to automatically publish your docs to GitHub Pages on every push to `main`:

```yaml
# .github/workflows/docs.yml
name: Deploy docs

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - name: Generate docs
        run: |
          npx gen-docs src \
            --out _site \
            --title "${{ github.event.repository.name }}" \
            --source-url "https://github.com/${{ github.repository }}/blob/main" \
            --json

      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site

      - id: deployment
        uses: actions/deploy-pages@v4
```

Enable GitHub Pages in your repo settings (Settings → Pages → Source: GitHub Actions) and your docs will be live at `https://<org>.github.io/<repo>` after every push.

---

## Known limitations

- **Inline anonymous callbacks** passed directly as call arguments (`arr.map(x => x * 2)`) are not documented — inserting a multi-line block there would mangle the expression. Named declarations (functions, class members, variables, object properties) are all covered.
- **Type inference is 100% syntactic.** The tool reads what your code *looks like*, not what it *means*. It never evaluates, imports, or type-checks.
- **Multi-declarator statements** (`const a = 1, b = 2;`) get one combined block rather than per-declarator docs.
- **`.d.ts` files** are skipped — no implementation to document.
- **`gen-docs` does not serve** — the output is a static site. Use any static file server (`npx serve docs`) or deploy to GitHub Pages, Netlify, Vercel, etc.

---

## License

MIT © [Chintan](https://github.com/imchintoo)

---
slug: merged-docs-site-npm-workspaces-programmatic-api
title: 'One Script, Every Package: A Working Merged Docs Build for npm Workspaces'
description: A copy-pasteable Node script that walks every package in an npm workspaces monorepo and builds one merged documentation site using jsdoc-scribe's programmatic API — the working example the TypeDoc monorepo-mode comparison post promised but didn't include.
date: 2026-08-13
readingTime: 8 min read
tags: [Monorepo, TypeScript, NodeJS, DeveloperTools, Documentation, npm]
image: ../assets/merged-docs-site-npm-workspaces-programmatic-api.png
---

We wrote a comparison piece a week ago about TypeDoc's `packages` monorepo mode — the per-package config duplication, the lack of root-level inheritance, the cross-package reference friction that's still an open issue as of 2026. That post made the case that jsdoc-scribe's approach is simpler. It didn't show the simpler approach actually running. This one does, with a real script against a real monorepo: this project's own repo.

## The setup: a monorepo that isn't hypothetical

`jsdoc-scribe`'s own repo is an npm workspaces monorepo. The root `package.json` declares it plainly:

```json
"workspaces": [
  "packages/*"
]
```

Right now that resolves to one member package, `packages/eslint-plugin-jsdoc-scribe`, alongside the root package's own `lib/` and `bin/` directories. The internal docs build script already reflects this — it's been running in production since before this post existed:

```json
"docs:internal": "node bin/gen-docs.js lib bin packages/eslint-plugin-jsdoc-scribe --quality --out docs-internal --title jsdoc-scribe"
```

That's the CLI proving the pattern works: pass multiple input paths, get one site. What's never been shown is the programmatic equivalent — the version you'd actually want if you're wiring documentation generation into a build script, a CI step, or a tool of your own, rather than hardcoding a package list by hand every time a new workspace member gets added.

## Why the programmatic API is the right layer for this

jsdoc-scribe exposes its doc-site builder as a separate subpath export, `jsdoc-scribe/docs`, distinct from the main comment-generation entry point. Its type declarations (`lib/docs.d.ts`) show exactly the shape available:

```ts
export function generateSite(
  inputPaths: string | string[],
  options?: GenerateSiteOptions,
): Promise<RenderedPage[]>;
```

`inputPaths` already accepts an array. That's the detail that makes this whole exercise almost trivial: you don't need to call `generateSite` once per package and stitch the outputs together yourself. Point it at every workspace member directory in one call, and it collects files from each, extracts documentation from all of them, and returns `RenderedPage[]` — a flat array of `{ path, html }` objects representing one coherent, cross-linked site. There's no `packageOptions` block to keep in sync, because there's no per-package configuration step to duplicate in the first place. Configuration — `projectName`, `baseUrl`, `description` — is set once, at the top level, for the whole call.

The only piece jsdoc-scribe doesn't do for you is resolving `workspaces` glob patterns into real directories. That's an npm-level concept, not a docs-generator concept, so it belongs in your script, not the library. Here's a minimal version.

## The script

```js
#!/usr/bin/env node
// scripts/build-workspace-docs.js
// Resolves this project's `workspaces` field and builds one merged
// documentation site across every member package.

const fs = require("fs");
const path = require("path");
const { generateSite } = require("jsdoc-scribe/docs");

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "docs");

/** Expand simple "dir/*" workspace globs into real, existing package directories. */
function resolveWorkspaces(patterns) {
  const dirs = [];
  for (const pattern of patterns) {
    if (pattern.endsWith("/*")) {
      const base = path.join(ROOT, pattern.slice(0, -2));
      if (!fs.existsSync(base)) continue;
      for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
        if (entry.isDirectory()) dirs.push(path.join(base, entry.name));
      }
    } else {
      const abs = path.join(ROOT, pattern);
      if (fs.existsSync(abs)) dirs.push(abs);
    }
  }
  return dirs;
}

async function main() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const workspaces = pkg.workspaces || [];

  if (workspaces.length === 0) {
    console.error("No `workspaces` field found in package.json — nothing to build.");
    process.exit(1);
  }

  const inputPaths = resolveWorkspaces(workspaces);
  console.log(`Building merged docs for ${inputPaths.length} workspace package(s):`);
  inputPaths.forEach((p) => console.log(`  - ${path.relative(ROOT, p)}`));

  const pages = await generateSite(inputPaths, {
    projectName: pkg.name,
    version: pkg.version,
    rootDir: ROOT, // enables the Architecture Insight page
  });

  for (const page of pages) {
    const outPath = path.join(OUT_DIR, page.path);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, page.html);
  }

  console.log(`Wrote ${pages.length} page(s) to ${path.relative(ROOT, OUT_DIR)}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

Run it with `node scripts/build-workspace-docs.js` from the repo root, add it as an npm script (`"docs:workspaces": "node scripts/build-workspace-docs.js"`), or drop it into a CI step right after `npm ci`. No flags, no per-package config file, no manual list of directories to update every time a package gets added or removed — the script re-reads `workspaces` fresh on every run.

## What's deliberately left out, and why

The `resolveWorkspaces` function above handles the common `"dir/*"` glob shape, which covers the large majority of real npm/pnpm/Yarn workspace configs. It does not implement full glob semantics (nested wildcards, negation patterns like `"!packages/experimental"`). If your workspace config needs those, swap in a real glob library — `fast-glob` or the one already in your `node_modules` tree from another dependency — for the resolution step only. That boundary is intentional: jsdoc-scribe's programmatic API takes a plain array of paths and has no opinion about how you produced it, which is exactly what makes it composable with whatever workspace tooling you're already running, Turborepo or pnpm or plain npm workspaces alike.

It's also worth being precise about what this script does not add to jsdoc-scribe's dependency surface. `generateSite` is doing exactly what `gen-docs` already does under the hood — the same TypeScript-compiler-API-as-parser extraction, the same renderer, the same optional Architecture Insight page when `rootDir` is set. This isn't a new capability; it's the existing one, exposed at the layer where it's actually useful for teams that want documentation generation wired into their own tooling instead of invoked as a standalone CLI step.

## Bottom line

If you run an npm, pnpm, or Yarn workspaces monorepo and have been putting off a unified docs site because every option you've looked at wants a config file per package, the script above is the whole solution, not a sketch of one. It reads your existing `workspaces` field, needs no changes to any package's own `package.json`, and produces one merged, cross-linked site through a single function call. Point `OUT_DIR` at wherever your CI already deploys from, and you have the automated equivalent of the [10-minute GitHub Actions + Pages setup](./docs-site-live-in-under-10-minutes.html) we covered a few weeks ago, now scoped to every package in the repo instead of one.

```bash
npx jsdoc-scribe . --write            # try it once, no install
npm install --save-dev jsdoc-scribe   # add it to the project
```

Full docs at [imchintoo.github.io/jsdoc-scribe](https://imchintoo.github.io/jsdoc-scribe/blog/index.html), the package on [npm](https://www.npmjs.com/package/jsdoc-scribe), and the source on [GitHub](https://github.com/imchintoo/jsdoc-scribe).

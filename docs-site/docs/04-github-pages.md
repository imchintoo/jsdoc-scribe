---
slug: github-pages
title: GitHub Pages Deployment
description: Publish generated documentation to GitHub Pages with the official Pages actions.
command: npm run docs:pages
---

## What GitHub Pages is used for

GitHub Pages is the simplest public hosting target for jsdoc-scribe output. The generated site is static HTML, CSS, JavaScript, images, sitemap, and RSS, so it can be published without a server.

Use this when your package or internal library needs documentation at a stable URL. Readers can open the landing page, follow Quick Start, browse CLI and integration guides, read blog posts, and inspect API reference pages from one published site.

## Why deploy from CI

Deploying from CI keeps the site tied to the repository state. When main changes, the published documentation is rebuilt from the same source and package version. That avoids the common problem where docs drift because someone forgot to manually upload a folder.

The recommended output folder is _site because it is a build artifact. Keep source content in docs-site and generated HTML out of source control unless your project intentionally serves committed static files.

## Repository setting

In GitHub, open Settings, then Pages, and set Source to GitHub Actions. This allows the workflow to upload and deploy the generated _site folder.

## Deployment workflow

Generate into _site, upload the Pages artifact, then deploy it.

```yaml
name: Deploy docs
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run docs:pages
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## What to check after deployment

After the workflow completes, open the Pages URL and verify that the header shows the current package version, docs pages load, API reference links work, and sitemap.xml is reachable. Search engines need the public site and sitemap to crawl the documentation cleanly.

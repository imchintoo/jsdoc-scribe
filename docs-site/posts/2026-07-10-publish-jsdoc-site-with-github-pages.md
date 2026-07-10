---
slug: publish-jsdoc-site-with-github-pages
title: Publish a JSDoc documentation site with GitHub Pages
description: How to turn jsdoc-scribe output into a public documentation site with GitHub Actions and GitHub Pages.
date: 2026-07-10
readingTime: 5 min read
tags: [GitHub Pages, CI, Docs]
image: ../assets/preview-quality.svg
---

A documentation workflow should be boring in the best way: push to main, build static files, deploy. GitHub Pages is a natural fit for jsdoc-scribe because the generated output is plain HTML, CSS, and JavaScript.

![jsdoc-scribe quality dashboard preview](../assets/preview-quality.svg)

## Recommended workflow

Keep generated output out of Git, generate it in CI, and upload the _site folder as the Pages artifact.

```bash
npm ci
npm run docs:pages
```

## Add richer blog content later

Blog posts in this site can include paragraphs, headings, images, videos, quotes, and code blocks, so tutorials can feel closer to a publishing platform while staying static and fast.

@[video](poster="../assets/preview.svg" caption="Optional video blocks are supported when you add a real video file or URL.")

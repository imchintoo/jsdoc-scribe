# Security Policy

## Supported Versions

Only the latest published version on npm receives security fixes.

| Version | Supported |
|---------|-----------|
| latest  | ✅        |
| older   | ❌        |

## Reporting a Vulnerability

jsdoc-scribe runs entirely locally — it reads local source files, parses them with the
`typescript` compiler API, and writes/renders local output. It makes no network calls and
has no server component. That said, if you find a security issue (e.g. a path-traversal bug
in file collection, or a way crafted source input could trigger unsafe behavior):

1. **Do not open a public GitHub issue for the report itself.**
2. Open a [GitHub issue](https://github.com/imchintoo/jsdoc-scribe/issues/new) titled
   `[SECURITY] <short description>` without reproduction details, and mention you'd like a
   private channel — the maintainer will follow up via GitHub to get details privately, or
3. Contact the maintainer directly through their GitHub profile
   ([@imchintoo](https://github.com/imchintoo)).

Please include:

- jsdoc-scribe version and Node version
- A minimal reproduction
- Impact assessment (what an attacker could do)

We aim to acknowledge reports within 5 business days.

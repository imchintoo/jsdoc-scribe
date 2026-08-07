"use strict";

// Root flat-config ESLint setup. Dogfoods this project's own
// eslint-plugin-jsdoc-scribe (packages/eslint-plugin-jsdoc-scribe, resolved
// locally via npm workspaces -- it isn't published to npm, so this only
// works because it's a workspace member, not because it's fetched from the
// registry) using the plugin's own `configs.recommended` preset exactly as
// it ships, with no project-specific rule overrides layered on top. This is
// deliberate: the point of running it here is to prove the same rules
// `gen-comments --lint` and the plugin's own README document actually hold
// up against a real codebase, not to build a bespoke config.
const jsdocScribe = require("eslint-plugin-jsdoc-scribe");

module.exports = [
    {
        ignores: [
            "node_modules/**",
            "**/node_modules/**",
            "docs/**",
            "docs-internal/**",
            "docs-dashboard/**",
            "_site/**",
            "quality-results/**",
            "bench/generated/**",
            "sample/**",
            "coverage/**"
        ]
    },
    jsdocScribe.configs.recommended
];

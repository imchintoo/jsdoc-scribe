"use strict";

/**
 * eslint-plugin-jsdoc-scribe
 * ----------------------------------------
 * Flat-config ESLint plugin exposing the same 12 rule names jsdoc-scribe's
 * `--lint` CLI flag ships in v1.18.0 (docs/backlog/adr-012-eslint-plugin-package.md,
 * §5 — the ADR's section title says "9" but the rule list it enumerates has 12;
 * that discrepancy is called out in sprint-12-scope.md's closeout note rather
 * than silently ported through). `no-bad-blocks` is intentionally not included —
 * it depends on jsdoc-scribe's TypeScript-Compiler-API malformed-comment
 * detection (extractor.js's `badComment` field), which has no ESLint/ESTree
 * equivalent (see ADR §2).
 *
 * Legacy `.eslintrc` config and autofixing (`--fix`) are both out of scope for
 * v1 — see ADR §4 and §6.
 */

const requireJsdoc = require("./rules/require-jsdoc");
const requireParam = require("./rules/require-param");
const requireParamDescription = require("./rules/require-param-description");
const checkParamNames = require("./rules/check-param-names");
const requireReturns = require("./rules/require-returns");
const requireReturnsDescription = require("./rules/require-returns-description");
const requireReturnsCheck = require("./rules/require-returns-check");
const requireDescription = require("./rules/require-description");
const checkTagNames = require("./rules/check-tag-names");
const emptyTags = require("./rules/empty-tags");
const noMultiAsterisks = require("./rules/no-multi-asterisks");
const noBlankBlockDescriptions = require("./rules/no-blank-block-descriptions");

const { version } = require("./package.json");

const rules = {
    "require-jsdoc": requireJsdoc,
    "require-param": requireParam,
    "require-param-description": requireParamDescription,
    "check-param-names": checkParamNames,
    "require-returns": requireReturns,
    "require-returns-description": requireReturnsDescription,
    "require-returns-check": requireReturnsCheck,
    "require-description": requireDescription,
    "check-tag-names": checkTagNames,
    "empty-tags": emptyTags,
    "no-multi-asterisks": noMultiAsterisks,
    "no-blank-block-descriptions": noBlankBlockDescriptions,
};

const plugin = {
    meta: {
        name: "eslint-plugin-jsdoc-scribe",
        version,
    },
    rules,
};

// Flat-config recommended preset. Consumers do:
//   import jsdocScribe from "eslint-plugin-jsdoc-scribe";
//   export default [jsdocScribe.configs.recommended];
plugin.configs = {
    recommended: {
        plugins: { "jsdoc-scribe": plugin },
        rules: {
            "jsdoc-scribe/require-jsdoc": "warn",
            "jsdoc-scribe/require-param": "warn",
            "jsdoc-scribe/require-param-description": "warn",
            "jsdoc-scribe/check-param-names": "warn",
            "jsdoc-scribe/require-returns": "warn",
            "jsdoc-scribe/require-returns-description": "warn",
            "jsdoc-scribe/require-returns-check": "warn",
            "jsdoc-scribe/require-description": "warn",
            "jsdoc-scribe/check-tag-names": "error",
            "jsdoc-scribe/empty-tags": "warn",
            "jsdoc-scribe/no-multi-asterisks": "warn",
            "jsdoc-scribe/no-blank-block-descriptions": "warn",
        },
    },
};

module.exports = plugin;

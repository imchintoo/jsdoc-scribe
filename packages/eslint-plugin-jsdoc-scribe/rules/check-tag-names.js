"use strict";

const { getSourceCode, KNOWN_TAGS } = require("./utils");

const TAG_RE = /@([a-zA-Z][\w-]*)/g;

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow unknown JSDoc tag names.",
            url: "https://github.com/imchintoo/jsdoc-scribe/tree/main/packages/eslint-plugin-jsdoc-scribe",
        },
        schema: [],
        messages: {
            unknown: 'Unknown tag "@{{tag}}".',
        },
    },
    create(context) {
        const sourceCode = getSourceCode(context);
        return {
            Program() {
                for (const comment of sourceCode.getAllComments()) {
                    if (comment.type !== "Block" || !comment.value.startsWith("*")) continue;
                    TAG_RE.lastIndex = 0;
                    let m;
                    while ((m = TAG_RE.exec(comment.value))) {
                        const tag = m[1].toLowerCase();
                        if (!KNOWN_TAGS.has(tag)) {
                            context.report({ loc: comment.loc, messageId: "unknown", data: { tag: m[1] } });
                        }
                    }
                }
            },
        };
    },
};

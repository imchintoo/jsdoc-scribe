"use strict";

const { getSourceCode, NO_DESC_TAGS, lightFixComment } = require("./utils");

module.exports = {
    meta: {
        type: "suggestion",
        fixable: "code",
        docs: {
            description: "Disallow trailing description text on tags that should never have one (e.g. @readonly, @private).",
            url: "https://github.com/imchintoo/jsdoc-scribe/tree/main/packages/eslint-plugin-jsdoc-scribe",
        },
        schema: [],
        messages: {
            unexpected: '"@{{tag}}" should not have a description.',
        },
    },
    create(context) {
        const sourceCode = getSourceCode(context);
        return {
            Program() {
                for (const comment of sourceCode.getAllComments()) {
                    if (comment.type !== "Block" || !comment.value.startsWith("*")) continue;
                    comment.value.split("\n").forEach((line) => {
                        const stripped = line.replace(/^\s*\*+\s?/, "");
                        const m = stripped.match(/^@([a-zA-Z][\w-]*)\s*(.*)$/);
                        if (m && NO_DESC_TAGS.has(m[1].toLowerCase()) && m[2].trim()) {
                            context.report({
                                loc: comment.loc,
                                messageId: "unexpected",
                                data: { tag: m[1] },
                                fix(fixer) {
                                    const fixed = lightFixComment(comment, "empty-tags", null);
                                    return fixed ? fixer.replaceText(comment, fixed) : null;
                                },
                            });
                        }
                    });
                }
            },
        };
    },
};

"use strict";

const { getSourceCode, lightFixComment } = require("./utils");

module.exports = {
    meta: {
        type: "suggestion",
        fixable: "code",
        docs: {
            description: "Disallow unexpected extra asterisks on a JSDoc comment line.",
            url: "https://github.com/imchintoo/jsdoc-scribe/tree/main/packages/eslint-plugin-jsdoc-scribe",
        },
        schema: [],
        messages: {
            extra: "Unexpected multiple asterisks.",
        },
    },
    create(context) {
        const sourceCode = getSourceCode(context);
        return {
            Program() {
                for (const comment of sourceCode.getAllComments()) {
                    if (comment.type !== "Block" || !comment.value.startsWith("*")) continue;
                    const lines = comment.value.split("\n");
                    lines.forEach((line, idx) => {
                        if (idx === 0) return;
                        if (idx === lines.length - 1 && /^\s*\*?\s*$/.test(line)) return;
                        if (/^\s*\*{2,}/.test(line)) {
                            context.report({
                                loc: comment.loc,
                                messageId: "extra",
                                fix(fixer) {
                                    const fixed = lightFixComment(comment, "no-multi-asterisks", null);
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

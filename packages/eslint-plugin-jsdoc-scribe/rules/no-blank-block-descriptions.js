"use strict";

const { getSourceCode, lightFixComment } = require("./utils");

module.exports = {
    meta: {
        type: "suggestion",
        fixable: "code",
        docs: {
            description: "Disallow a JSDoc block with no content at all.",
            url: "https://github.com/imchintoo/jsdoc-scribe/tree/main/packages/eslint-plugin-jsdoc-scribe",
        },
        schema: [],
        messages: {
            empty: "JSDoc block is empty.",
        },
    },
    create(context) {
        const sourceCode = getSourceCode(context);
        return {
            Program() {
                for (const comment of sourceCode.getAllComments()) {
                    if (comment.type !== "Block" || !comment.value.startsWith("*")) continue;
                    const stripped = comment.value
                        .split("\n")
                        .map((l) => l.replace(/^\s*\*\s?/, ""))
                        .join("")
                        .trim();
                    if (stripped === "") {
                        context.report({
                            loc: comment.loc,
                            messageId: "empty",
                            fix(fixer) {
                                const fixed = lightFixComment(comment, "no-blank-block-descriptions", null);
                                return fixed ? fixer.replaceText(comment, fixed) : null;
                            },
                        });
                    }
                }
            },
        };
    },
};

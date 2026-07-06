"use strict";

const { parseComment, extractReturnsTag, visitFunctionLike, reportNodeOf, rebuildFunctionComment, getSourceCode } = require("./utils");

module.exports = {
    meta: {
        type: "suggestion",
        fixable: "code",
        docs: {
            description: "Require a description on the @returns tag.",
            url: "https://github.com/imchintoo/jsdoc-scribe/tree/main/packages/eslint-plugin-jsdoc-scribe",
        },
        schema: [],
        messages: {
            missing: "@returns has no description.",
        },
    },
    create(context) {
        const sourceCode = getSourceCode(context);
        return visitFunctionLike(context, (node, jsdocComment) => {
            if (!jsdocComment) return;
            const { tags } = parseComment(jsdocComment.value);
            const returns = extractReturnsTag(tags);
            if (returns && !returns.description) {
                context.report({
                    node: reportNodeOf(node),
                    messageId: "missing",
                    fix(fixer) {
                        return fixer.replaceText(jsdocComment, rebuildFunctionComment(sourceCode, node, jsdocComment));
                    },
                });
            }
        });
    },
};

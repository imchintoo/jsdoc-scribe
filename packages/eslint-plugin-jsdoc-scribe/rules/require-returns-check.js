"use strict";

const {
    parseComment,
    extractReturnsTag,
    hasReturnWithValue,
    functionBodyNode,
    visitFunctionLike,
    reportNodeOf,
    rebuildFunctionComment,
    getSourceCode,
} = require("./utils");

module.exports = {
    meta: {
        type: "suggestion",
        fixable: "code",
        docs: {
            description: "Disallow a @returns tag on functions that never return a value.",
            url: "https://github.com/imchintoo/jsdoc-scribe/tree/main/packages/eslint-plugin-jsdoc-scribe",
        },
        schema: [],
        messages: {
            unnecessary: "@returns present but function has no return value.",
        },
    },
    create(context) {
        const sourceCode = getSourceCode(context);
        return visitFunctionLike(context, (node, jsdocComment) => {
            if (!jsdocComment) return;
            const { tags } = parseComment(jsdocComment.value);
            if (!extractReturnsTag(tags)) return;
            if (!hasReturnWithValue(functionBodyNode(node))) {
                context.report({
                    node: reportNodeOf(node),
                    messageId: "unnecessary",
                    fix(fixer) {
                        return fixer.replaceText(jsdocComment, rebuildFunctionComment(sourceCode, node, jsdocComment));
                    },
                });
            }
        });
    },
};

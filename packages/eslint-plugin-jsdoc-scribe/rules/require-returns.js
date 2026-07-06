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
            description: "Require a @returns tag when a function returns a value.",
            url: "https://github.com/imchintoo/jsdoc-scribe/tree/main/packages/eslint-plugin-jsdoc-scribe",
        },
        schema: [],
        messages: {
            missing: "Missing @returns.",
        },
    },
    create(context) {
        const sourceCode = getSourceCode(context);
        return visitFunctionLike(context, (node, jsdocComment) => {
            if (!jsdocComment) return;
            if (!hasReturnWithValue(functionBodyNode(node))) return;
            const { tags } = parseComment(jsdocComment.value);
            if (!extractReturnsTag(tags)) {
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

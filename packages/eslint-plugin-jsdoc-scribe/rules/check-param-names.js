"use strict";

const {
    parseComment,
    extractParamTags,
    paramNames,
    functionParams,
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
            description: "Require @param tag order to match function parameter order.",
            url: "https://github.com/imchintoo/jsdoc-scribe/tree/main/packages/eslint-plugin-jsdoc-scribe",
        },
        schema: [],
        messages: {
            mismatch: "@param order does not match function parameter order.",
        },
    },
    create(context) {
        const sourceCode = getSourceCode(context);
        return visitFunctionLike(context, (node, jsdocComment) => {
            if (!jsdocComment) return;
            const astNames = paramNames(functionParams(node));
            const { tags } = parseComment(jsdocComment.value);
            const docNames = extractParamTags(tags).map((p) => p.name);

            const sameSet = astNames.length === docNames.length && astNames.every((n) => docNames.includes(n));
            if (!sameSet || astNames.length <= 1) return;

            const ordered = astNames.every((n, i) => docNames[i] === n);
            if (!ordered) {
                context.report({
                    node: reportNodeOf(node),
                    messageId: "mismatch",
                    fix(fixer) {
                        return fixer.replaceText(jsdocComment, rebuildFunctionComment(sourceCode, node, jsdocComment));
                    },
                });
            }
        });
    },
};

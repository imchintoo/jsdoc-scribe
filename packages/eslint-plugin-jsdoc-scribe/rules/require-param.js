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
            description: "Require a @param tag for every function parameter.",
            url: "https://github.com/imchintoo/jsdoc-scribe/tree/main/packages/eslint-plugin-jsdoc-scribe",
        },
        schema: [],
        messages: {
            missing: 'Missing @param for "{{name}}".',
        },
    },
    create(context) {
        const sourceCode = getSourceCode(context);
        return visitFunctionLike(context, (node, jsdocComment) => {
            if (!jsdocComment) return;
            const names = paramNames(functionParams(node));
            if (!names.length) return;

            const { tags } = parseComment(jsdocComment.value);
            const documented = new Set(extractParamTags(tags).map((p) => p.name));

            for (const name of names) {
                if (!documented.has(name)) {
                    context.report({
                        node: reportNodeOf(node),
                        messageId: "missing",
                        data: { name },
                        fix(fixer) {
                            return fixer.replaceText(jsdocComment, rebuildFunctionComment(sourceCode, node, jsdocComment));
                        },
                    });
                }
            }
        });
    },
};

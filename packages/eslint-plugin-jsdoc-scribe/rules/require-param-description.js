"use strict";

const { parseComment, extractParamTags, visitFunctionLike, reportNodeOf, rebuildFunctionComment, getSourceCode } = require("./utils");

module.exports = {
    meta: {
        type: "suggestion",
        fixable: "code",
        docs: {
            description: "Require a description on every @param tag.",
            url: "https://github.com/imchintoo/jsdoc-scribe/tree/main/packages/eslint-plugin-jsdoc-scribe",
        },
        schema: [],
        messages: {
            missing: '@param "{{name}}" has no description.',
        },
    },
    create(context) {
        const sourceCode = getSourceCode(context);
        return visitFunctionLike(context, (node, jsdocComment) => {
            if (!jsdocComment) return;
            const { tags } = parseComment(jsdocComment.value);
            for (const p of extractParamTags(tags)) {
                if (!p.description) {
                    context.report({
                        node: reportNodeOf(node),
                        messageId: "missing",
                        data: { name: p.name },
                        fix(fixer) {
                            return fixer.replaceText(jsdocComment, rebuildFunctionComment(sourceCode, node, jsdocComment));
                        },
                    });
                }
            }
        });
    },
};

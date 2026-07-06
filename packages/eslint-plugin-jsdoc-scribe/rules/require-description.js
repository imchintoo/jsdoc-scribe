"use strict";

const {
    getSourceCode,
    getJSDocComment,
    parseComment,
    visitFunctionLike,
    reportNodeOf,
    rebuildFunctionComment,
    TODO_DESCRIPTION,
} = require("./utils");

module.exports = {
    meta: {
        type: "suggestion",
        fixable: "code",
        docs: {
            description: "Require a description in every JSDoc block.",
            url: "https://github.com/imchintoo/jsdoc-scribe/tree/main/packages/eslint-plugin-jsdoc-scribe",
        },
        schema: [],
        messages: {
            missing: "Missing description.",
        },
    },
    create(context) {
        const sourceCode = getSourceCode(context);

        function checkClass(node) {
            const jsdocComment = getJSDocComment(sourceCode, node);
            if (!jsdocComment) return;
            const { description } = parseComment(jsdocComment.value);
            if (!description) {
                context.report({
                    node,
                    messageId: "missing",
                    fix(fixer) {
                        const lines = ("/*" + jsdocComment.value + "*/").split("\n");
                        lines.splice(1, 0, " * " + TODO_DESCRIPTION);
                        return fixer.replaceText(jsdocComment, lines.join("\n"));
                    },
                });
            }
        }

        const fnVisitors = visitFunctionLike(context, (node, jsdocComment) => {
            if (!jsdocComment) return;
            const { description } = parseComment(jsdocComment.value);
            if (!description) {
                context.report({
                    node: reportNodeOf(node),
                    messageId: "missing",
                    fix(fixer) {
                        return fixer.replaceText(jsdocComment, rebuildFunctionComment(sourceCode, node, jsdocComment));
                    },
                });
            }
        });

        return Object.assign({ ClassDeclaration: checkClass }, fnVisitors);
    },
};

"use strict";

const { getSourceCode, getJSDocComment } = require("./utils");

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require JSDoc comments on functions, classes, and methods.",
            url: "https://github.com/imchintoo/jsdoc-scribe/tree/main/packages/eslint-plugin-jsdoc-scribe",
        },
        schema: [],
        messages: {
            missing: "Missing JSDoc comment.",
        },
    },
    create(context) {
        const sourceCode = getSourceCode(context);

        function check(node) {
            if (!getJSDocComment(sourceCode, node)) {
                context.report({ node, messageId: "missing" });
            }
        }

        // For `const foo = function () {}` / `const foo = () => {}`, the JSDoc block
        // is leading the enclosing VariableDeclaration, not the declarator/function
        // itself — look for the comment there, but report at the declarator.
        function checkVariableFunction(fnNode) {
            const declarator = fnNode.parent;
            const declaration = declarator.parent;
            if (declaration.type !== "VariableDeclaration" || declaration.declarations.length !== 1) return;
            if (!getJSDocComment(sourceCode, declaration)) {
                context.report({ node: declarator, messageId: "missing" });
            }
        }

        return {
            FunctionDeclaration: check,
            ClassDeclaration: check,
            "VariableDeclarator > FunctionExpression": checkVariableFunction,
            "VariableDeclarator > ArrowFunctionExpression": checkVariableFunction,
            "MethodDefinition[kind!='get'][kind!='set']": check,
        };
    },
};

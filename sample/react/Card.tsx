import React from "react";

/**
 * @interface CardProps
 * @property {string} title
 * @property {string} subtitle
 * @property {React.ReactNode} children
 */
interface CardProps {
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
}

/**
 * `React.FC<Props>` typed component (arrow function assigned to a const) --
 * task-fw-01 fixture: exercises the typed-FC idiom, distinct from a plain
 * `function` declaration.
 * @param {CardProps} props
 * @returns {JSX.Element}
 */
export const Card: React.FC<CardProps> = (props) => {
    return React.createElement(
        "div",
        { className: "card" },
        React.createElement("h3", null, props.title),
        props.subtitle ? React.createElement("p", null, props.subtitle) : null,
        props.children,
    );
};

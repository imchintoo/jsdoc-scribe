import React from "react";

/**
 * @interface UserRowProps
 * @property {string} name
 * @property {string} email
 * @property {boolean} isActive
 */
interface UserRowProps {
    name: string;
    email: string;
    isActive: boolean;
}

/**
 * Component destructuring a typed Props interface directly in its
 * parameter list -- task-fw-01 fixture: exercises destructured-props
 * extraction, distinct from a single named `props` parameter (Button.tsx)
 * or a `React.FC<Props>` arrow (Card.tsx).
 * @param {UserRowProps} root0
 * @param {string} root0.name
 * @param {string} root0.email
 * @param {boolean} root0.isActive
 * @returns {JSX.Element}
 */
export function UserRow({ name, email, isActive }: UserRowProps) {
    return React.createElement(
        "tr",
        { className: isActive ? "active" : "" },
        React.createElement("td", null, name),
        React.createElement("td", null, email),
    );
}

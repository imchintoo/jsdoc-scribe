import React from "react";

/**
 * @interface ButtonProps
 * @property {string} label
 * @property {() => void} onClick
 * @property {boolean} disabled
 */
interface ButtonProps {
    label: string;
    onClick: () => void;
    disabled?: boolean;
}

/**
 * Plain function component -- task-fw-01 baseline fixture (sanity check).
 * @param {ButtonProps} props
 * @returns {JSX.Element}
 */
export function Button(props: ButtonProps) {
    return React.createElement(
        "button",
        { onClick: props.onClick, disabled: props.disabled },
        props.label,
    );
}

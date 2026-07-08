import React, { forwardRef } from "react";

/**
 * @interface TextInputProps
 * @property {string} placeholder
 * @property {string} defaultValue
 */
interface TextInputProps {
    placeholder?: string;
    defaultValue?: string;
}

/**
 * @typedef {HTMLInputElement} TextInputHandle
 */
type TextInputHandle = HTMLInputElement;

/**
 * `forwardRef<Handle, Props>((props, ref) => ...)` component -- task-fw-01
 * fixture: exercises the ref-forwarding idiom.
 * @param {TextInputProps} props
 * @param {React.Ref<TextInputHandle>} ref
 * @returns {JSX.Element}
 */
export const TextInput = forwardRef<TextInputHandle, TextInputProps>((props, ref) => {
    return React.createElement("input", {
        ref,
        placeholder: props.placeholder,
        defaultValue: props.defaultValue,
    });
});

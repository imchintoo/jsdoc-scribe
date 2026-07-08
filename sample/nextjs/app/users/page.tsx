import React from "react";

/**
 * @interface Metadata
 * @property {string} title
 * @property {string} description
 */
interface Metadata {
    title: string;
    description: string;
}

/**
 * App Router special export -- task-fw-01 fixture: `generateMetadata`.
 * @param {{ params: { id?: string } }} props
 * @returns {Promise<Metadata>}
 */
export async function generateMetadata(props: { params: { id?: string } }): Promise<Metadata> {
    return { title: "Users", description: "User directory" };
}

/**
 * App Router page component for the users route segment.
 * @returns {JSX.Element}
 */
export default function UsersPage() {
    return React.createElement("div", null, "Users");
}

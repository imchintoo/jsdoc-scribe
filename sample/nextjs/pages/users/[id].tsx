import React from "react";

/**
 * @interface UserPageProps
 * @property {string} id
 * @property {string} name
 */
interface UserPageProps {
    id: string;
    name: string;
}

/**
 * Pages Router data-fetching export -- task-fw-01 fixture:
 * `getServerSideProps`.
 * @param {{ params: { id: string } }} context
 * @returns {Promise<{ props: UserPageProps }>}
 */
export async function getServerSideProps(context: { params: { id: string } }) {
    return { props: { id: context.params.id, name: "User " + context.params.id } };
}

/**
 * Pages Router page component consuming the props above.
 * @param {UserPageProps} props
 * @returns {JSX.Element}
 */
export default function UserPage(props: UserPageProps) {
    return React.createElement("div", null, props.name);
}

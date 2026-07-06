// Type declarations for jsdoc-scribe's lint engine (`require("jsdoc-scribe/lint")`).
// Hand-written, not generated — kept intentionally small and matched to the actual
// exports of lib/lint.js. Exists primarily so packages/eslint-plugin-jsdoc-scribe
// (and any other consumer) can import KNOWN_TAGS/NO_DESC_TAGS as a single source of
// truth rather than duplicating the tag lists — see docs/backlog/adr-012-eslint-plugin-package.md.

export interface LintIssue {
    /** "functionName" | "ClassName.methodName" | "ClassName" | module-level symbol name. */
    symbol: string;
    /** Stable rule id, aligned with eslint-plugin-jsdoc's vocabulary where a 1:1 concept exists. */
    rule: string;
    /** Human-readable message. */
    message: string;
    line: number | null;
}

/**
 * Loosely-typed extractModule() output for one file — same relaxed shape
 * lib/docs.d.ts's ModuleDoc uses, since the extractor's shape is an internal
 * detail that evolves independently of this type declaration.
 */
export type ModuleData = Record<string, unknown>;

/** Lint a single module's extracted data. Pure, synchronous, no I/O. */
export function lintModule(moduleData: ModuleData): LintIssue[];

/** Standard JSDoc/TypeScript-flavor tag names recognized as "known" by check-tag-names. */
export const KNOWN_TAGS: Set<string>;

/** Tags that should never carry trailing description text (used by empty-tags). */
export const NO_DESC_TAGS: Set<string>;

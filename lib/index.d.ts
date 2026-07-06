// Type declarations for jsdoc-scribe's programmatic API (`require("jsdoc-scribe")`).
// Hand-written, not generated — kept intentionally small and matched to the actual
// exports of lib/index.js. Not part of semver-major surface unless jsdoc changes here
// do (see CHANGELOG for behavior-affecting releases).

import type { SourceFile } from "typescript";

export interface ProcessFileOptions {
    /** Write detected edits back to disk. Default: false (dry preview only unless `write` is set). */
    write?: boolean;
    /** Re-add JSDoc even for symbols that already have a leading block. Default: false. */
    force?: boolean;
    /** Suppress the per-file console.log line. Default: false. */
    silent?: boolean;
    /** Report what would change without writing or logging file counts. Default: false. */
    dryRun?: boolean;
}

export interface CoverageStats {
    /** Symbols that already have a JSDoc block (or would after `force`). */
    documented: number;
    /** Total documentable symbols found in the file. */
    total: number;
    /** Symbols missing a JSDoc block. */
    undocumented: number;
}

export interface SourceEdit {
    /** Character offset in the original source where `text` is inserted. */
    pos: number;
    /** The JSDoc block text (including trailing newline) to insert at `pos`. */
    text: string;
}

/**
 * Insert missing JSDoc blocks into a single source file (.js/.jsx/.ts/.tsx).
 * Returns the number of blocks added (or that would be added, in dry-run mode).
 */
export function processFile(filePath: string, options?: ProcessFileOptions): number;

/**
 * Report documentation coverage for a single file without modifying it.
 */
export function analyseFile(filePath: string): CoverageStats;

/**
 * Recursively collect source files under `inputPath` matching `extensions`,
 * skipping `ignoreDirs` and anything matching `ignorePatterns` (glob-lite).
 */
export function collectFiles(
    inputPath: string,
    extensions?: string[],
    ignoreDirs?: Set<string>,
    ignorePatterns?: string[],
): string[];

/**
 * Low-level: compute the raw insertion edits for an already-parsed TypeScript
 * SourceFile. Most callers want `processFile`/`analyseFile` instead.
 */
export function collectEdits(sourceFile: SourceFile, force?: boolean): SourceEdit[];

export const DEFAULT_EXTENSIONS: string[];
export const DEFAULT_IGNORE_DIRS: Set<string>;

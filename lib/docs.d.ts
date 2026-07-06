// Type declarations for jsdoc-scribe's doc-site API (`require("jsdoc-scribe/docs")`).
// Hand-written, not generated — kept intentionally small and matched to the actual
// exports of lib/docs.js.

export { collectFiles, DEFAULT_EXTENSIONS, DEFAULT_IGNORE_DIRS } from "./index";

/**
 * Extracted documentation model for a single source file. Shape mirrors what
 * `lib/extractor.js`'s `extractModule()` produces (functions/classes/members with
 * AST-derived params, return types, and parsed-JSDoc fields) — kept as a loose
 * record here rather than fully modeled, since it's an internal-shape detail that
 * evolves alongside the extractor, not a stable public contract on its own.
 */
export type ModuleDoc = Record<string, unknown>;

export interface RenderedPage {
    /** Output-relative path, e.g. "modules/lib__extractor.html". */
    path: string;
    /** Fully-rendered HTML for this page. */
    html: string;
}

/** Parse a single already-collected file into its ModuleDoc. Throws on parse failure. */
export function extractModule(filePath: string): ModuleDoc;

/**
 * Parse a batch of files into ModuleDocs. Never throws for an individual file —
 * failures are logged to stderr and omitted from the result array.
 */
export function extractModules(files: string[]): Promise<ModuleDoc[]>;

export interface BuildSiteOptions {
    projectName?: string;
    version?: string;
}

export interface GenerateSiteOptions extends BuildSiteOptions {
    extensions?: string[];
    ignoreDirs?: Set<string>;
}

/** Render a full multi-page HTML site from already-extracted ModuleDocs. */
export function buildSite(modules: ModuleDoc[], options?: BuildSiteOptions): RenderedPage[];

/**
 * One-shot convenience: collect files under `inputPaths`, extract docs, build the
 * HTML site — equivalent to `gen-docs`'s core pipeline, callable from a script.
 */
export function generateSite(
    inputPaths: string | string[],
    options?: GenerateSiteOptions,
): Promise<RenderedPage[]>;

/** The doc-site-relative label for a source file (its path with the common project root stripped). */
export function moduleLabel(filePath: string, modules: ModuleDoc[]): string;

/** The output HTML path for a source file's module page. */
export function moduleHtmlPath(filePath: string, modules: ModuleDoc[]): string;

"use strict";

/**
 * Regression coverage for docs/backlog/task-ts7-02-cli-failure-accounting.md —
 * per-file failure accounting across the 3 in-scope loops in bin/cli.js:
 *   1. the shared checkDrift/lint/fix loop,
 *   2. the check/dry-run loop,
 *   3. the write/default loop.
 * (`--coverage-badge` is intentionally out of scope for this fix and is not
 * covered here.)
 *
 * Before this fix, a file that threw inside extractModule/analyseFile/
 * processFile (e.g. permission-denied, so fs.readFileSync itself throws) was
 * silently dropped from the run: the CLI still printed a "clean" summary
 * ("No drift detected.", "No lint issues found.", "All symbols are
 * documented.") and exited 0, hiding the fact that not every input file was
 * actually processed. That is this story's headline bug — the tool must
 * never report a clean result when it didn't actually run.
 *
 * These spawn bin/cli.js directly (same convention as test/cli.test.js)
 * because the failure-accounting logic lives entirely in bin/cli.js's
 * per-file try/catch blocks, not in lib/*.js.
 *
 * The forcing mechanism is a chmod 000 file: the unreadable bit is on the
 * file itself, not its containing directory, so fs.readdirSync/fs.statSync
 * during collectFiles() still succeed and the file is still handed to the
 * per-file loop — only the loop's own fs.readFileSync(filePath, "utf8")
 * throws (EACCES). This mirrors exactly how backend-engineer manually
 * verified the fix during implementation.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const assert = require("assert");
const { execFileSync } = require("child_process");

const CLI = path.join(__dirname, "..", "bin", "cli.js");

function tmpDir(prefix) {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function runCli(args) {
    try {
        const out = execFileSync(process.execPath, [CLI, ...args], { encoding: "utf8" });
        return { status: 0, stdout: out };
    } catch (err) {
        return { status: err.status, stdout: err.stdout || "" };
    }
}

// Fully documented, drift-clean, lint-clean fixture — the same content
// test/cli.test.js already relies on to get exit 0 from --lint. Used
// wherever a test needs an "all healthy, nothing to flag at all" file.
const GOOD_CLEAN = [
    "/**",
    " * Add two numbers.",
    " * @param {number} a - first",
    " * @param {number} b - second",
    " * @returns {number} the sum",
    " */",
    "export function add(a: number, b: number): number { return a + b; }",
].join("\n") + "\n";

// Valid but undocumented — used where a test wants to prove the healthy file
// is still meaningfully processed (documented / reported on) alongside a
// sibling failure, not just "didn't blow up".
const GOOD_PLAIN = "export function add(a: number, b: number): number { return a + b; }\n";

/**
 * True if this environment actually enforces file-permission bits (chmod 000
 * blocks a read). Some sandboxes/CI run as root, or run on filesystems that
 * don't honour POSIX permission bits — this suite degrades to a single
 * documented no-op rather than reporting a false failure (or a false pass)
 * on those platforms.
 */
function permissionsEnforced() {
    const dir = tmpDir("cbg-perm-probe-");
    const file = path.join(dir, "probe.js");
    fs.writeFileSync(file, "x", "utf8");
    fs.chmodSync(file, 0o000);
    let enforced = false;
    try {
        fs.readFileSync(file, "utf8");
    } catch (err) {
        enforced = err.code === "EACCES" || err.code === "EPERM";
    }
    fs.chmodSync(file, 0o644);
    return enforced;
}

function unreadableFile(dir, name) {
    const file = path.join(dir, name);
    fs.writeFileSync(file, GOOD_PLAIN, "utf8");
    fs.chmodSync(file, 0o000);
    return file;
}

module.exports = function runFailureAccountingTests(check) {
    const PERMS_ENFORCED = permissionsEnforced();

    if (!PERMS_ENFORCED) {
        check(
            "cli failure-accounting: SKIPPED — this environment does not enforce file permissions " +
                "(chmod 000 did not block a read), cannot force a per-file exception this way",
            () => assert.ok(true),
        );
        return;
    }

    const CASES = [
        { flags: ["--check-drift"], label: "--check-drift" },
        { flags: ["--lint"], label: "--lint" },
        { flags: ["--lint", "--fix"], label: "--lint --fix" },
        { flags: ["--check"], label: "--check" },
        { flags: ["--dry-run"], label: "--dry-run" },
        { flags: ["--write"], label: "--write" },
    ];

    // ---- Healthy runs: zero failures means zero new output, exit 0 ----
    // (story AC4 — the fix must be byte-for-byte invisible on a clean run)
    for (const { flags, label } of CASES) {
        check(`cli failure-accounting: ${label} on an all-healthy set prints no failure line and exits 0`, () => {
            const dir = tmpDir("cbg-fa-healthy-");
            fs.writeFileSync(path.join(dir, "ok.ts"), GOOD_CLEAN, "utf8");
            const res = runCli([dir, ...flags]);
            assert.doesNotMatch(res.stdout, /failed to parse/, `${label}: unexpected failure line on a healthy run`);
            assert.strictEqual(res.status, 0, `${label}: expected exit 0 on an all-healthy run`);
        });
    }

    // ---- Mixed set: 1 healthy + 1 broken ----
    for (const { flags, label } of CASES) {
        check(`cli failure-accounting: ${label} on a mixed healthy+broken set reports "1 file(s) failed to parse." and exits 1`, () => {
            const dir = tmpDir("cbg-fa-mixed-");
            fs.writeFileSync(path.join(dir, "good.ts"), GOOD_PLAIN, "utf8");
            unreadableFile(dir, "bad.ts");
            const res = runCli([dir, ...flags]);
            assert.match(res.stdout, /^1 file\(s\) failed to parse\.$/m, `${label}: expected exact "1 file(s) failed to parse." line`);
            assert.strictEqual(res.status, 1, `${label}: expected exit 1 when any file fails to parse`);
        });
    }

    // ---- The 100%-failure case: every input file broken, zero healthy ----
    // This is the story's headline bug, tested explicitly rather than only
    // inferred from the mixed-set cases above.
    for (const { flags, label } of CASES) {
        check(`cli failure-accounting: ${label} with 100% broken input (0 healthy files) still reports the failure and exits 1`, () => {
            const dir = tmpDir("cbg-fa-allbroken-");
            unreadableFile(dir, "bad1.ts");
            unreadableFile(dir, "bad2.ts");
            const res = runCli([dir, ...flags]);
            assert.match(res.stdout, /^2 file\(s\) failed to parse\.$/m, `${label}: expected exact "2 file(s) failed to parse." line`);
            assert.strictEqual(res.status, 1, `${label}: expected exit 1 when 100% of input files fail`);
        });
    }

    // ---- Exact wording: identical string pattern across all 3 loops ----
    check("cli failure-accounting: exact wording is identical across the checkDrift/lint/fix loop, the check/dry-run loop, and the write loop", () => {
        const dir = tmpDir("cbg-fa-wording-");
        unreadableFile(dir, "bad.ts");
        const wordingRe = /^1 file\(s\) failed to parse\.$/m;
        assert.match(runCli([dir, "--lint"]).stdout, wordingRe, "--lint wording mismatch");
        assert.match(runCli([dir, "--check"]).stdout, wordingRe, "--check wording mismatch");
        assert.match(runCli([dir, "--write"]).stdout, wordingRe, "--write wording mismatch");
    });

    // ---- --write: broken file is left alone; healthy file is still processed ----
    check("cli failure-accounting: --write documents the healthy file normally and leaves the broken file untouched (not partially written)", () => {
        const dir = tmpDir("cbg-fa-write-");
        const goodFile = path.join(dir, "good.ts");
        fs.writeFileSync(goodFile, GOOD_PLAIN, "utf8");
        const badFile = unreadableFile(dir, "bad.ts");
        const badModeBefore = fs.statSync(badFile).mode;

        const res = runCli([dir, "--write"]);

        assert.strictEqual(res.status, 1);
        assert.match(res.stdout, /1 file\(s\) failed to parse\./);

        const goodAfter = fs.readFileSync(goodFile, "utf8");
        assert.match(goodAfter, /@param \{number\} a/, "the healthy sibling file should still be documented despite the other file's failure");

        assert.strictEqual(fs.statSync(badFile).mode, badModeBefore, "the broken file's mode/content must be untouched as a side effect of the write loop");

        fs.chmodSync(badFile, 0o644); // restore so the OS can clean up the tmp dir
    });

    // ---- --dry-run: exits 1 on a parse failure even with nothing else to flag ----
    // Story AC3 makes --dry-run's failure-exit-code behavior explicit
    // ("regardless of what the ... counters say") — a healthy file with zero
    // undocumented symbols must not mask a sibling parse failure.
    check("cli failure-accounting: --dry-run exits 1 on a parse failure even when the healthy file has nothing left to document", () => {
        const dir = tmpDir("cbg-fa-dryrun-clean-");
        fs.writeFileSync(path.join(dir, "ok.ts"), GOOD_CLEAN, "utf8");
        unreadableFile(dir, "bad.ts");

        const res = runCli([dir, "--dry-run"]);
        assert.strictEqual(res.status, 1, "--dry-run must exit 1 on a parse failure regardless of the undocumented-symbol count");
        assert.match(res.stdout, /1 file\(s\) failed to parse\./);
    });

    // ---- No "false clean" messages when every input file failed to parse ----
    // tech-lead review (BLOCKED on the first pass of this task): the summary
    // lines below must be gated on failedTotal === 0 too, not just their own
    // counter. With 100% broken input, 0 is technically true for driftTotal/
    // lintTotal/undocumentedSymbols, but printing "No drift detected" etc. in
    // that situation is a false-clean claim — nothing was actually checked.
    check('cli failure-accounting: --check-drift with 100% broken input never prints "No drift detected"', () => {
        const dir = tmpDir("cbg-fa-falseclean-drift-");
        unreadableFile(dir, "bad1.ts");
        unreadableFile(dir, "bad2.ts");
        const res = runCli([dir, "--check-drift"]);
        assert.doesNotMatch(res.stdout, /No drift detected/, "must not claim a clean drift result when every file failed to parse");
        assert.match(res.stdout, /^2 file\(s\) failed to parse\.$/m);
        assert.strictEqual(res.status, 1);
    });

    check('cli failure-accounting: --lint with 100% broken input never prints "No lint issues found"', () => {
        const dir = tmpDir("cbg-fa-falseclean-lint-");
        unreadableFile(dir, "bad1.ts");
        unreadableFile(dir, "bad2.ts");
        const res = runCli([dir, "--lint"]);
        assert.doesNotMatch(res.stdout, /No lint issues found/, "must not claim a clean lint result when every file failed to parse");
        assert.match(res.stdout, /^2 file\(s\) failed to parse\.$/m);
        assert.strictEqual(res.status, 1);
    });

    check('cli failure-accounting: --check with 100% broken input never prints "All symbols are documented"', () => {
        const dir = tmpDir("cbg-fa-falseclean-check-");
        unreadableFile(dir, "bad1.ts");
        unreadableFile(dir, "bad2.ts");
        const res = runCli([dir, "--check"]);
        assert.doesNotMatch(res.stdout, /All symbols are documented/, "must not claim full coverage when every file failed to parse");
        assert.match(res.stdout, /^2 file\(s\) failed to parse\.$/m);
        assert.strictEqual(res.status, 1);
    });
};

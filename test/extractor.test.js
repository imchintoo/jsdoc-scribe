"use strict";

/**
 * Extractor unit tests — tests lib/extractor.js in isolation.
 * Each test creates a minimal temp TS/JS file, runs extractModule(), and
 * asserts specific fields on the returned module model.
 */

const fs   = require("fs");
const path = require("path");
const os   = require("os");
const assert = require("assert");
const { extractModule } = require("../lib/extractor.js");

function tmp(name, content) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "scribe-ext-"));
    const file = path.join(dir, name);
    fs.writeFileSync(file, content, "utf8");
    return file;
}

module.exports = function runExtractorTests(check) {

    check("extractor: @module description and @since extracted from top-of-file JSDoc", () => {
        const f = tmp("mod.ts", [
            "/**",
            " * @module auth",
            " * @description Authentication utilities for the app.",
            " * @since 1.2.0",
            " */",
            "export function login(): void {}",
        ].join("\n"));
        const mod = extractModule(f);
        assert.ok(mod.description && mod.description.includes("Authentication utilities"), "description not extracted");
        assert.strictEqual(mod.since, "1.2.0", "@since not extracted");
    });

    check("extractor: @param type and description extracted from JSDoc block", () => {
        const f = tmp("p.ts", [
            "/**",
            " * Greet a user.",
            " * @param {string} name - The user name.",
            " * @param {number} [age] - Optional age.",
            " */",
            "export function greet(name: string, age?: number): string { return name; }",
        ].join("\n"));
        const mod = extractModule(f);
        const fn  = mod.functions[0];
        assert.ok(fn, "function not extracted");
        assert.ok(fn.jsdocParams && fn.jsdocParams.length >= 1, "no jsdocParams");
        const p0 = fn.jsdocParams.find(p => p.name === "name");
        assert.ok(p0 && p0.description, "@param description not extracted");
        assert.strictEqual(p0.type, "string", "@param type not extracted");
    });

    check("extractor: @returns type and description extracted", () => {
        const f = tmp("r.ts", [
            "/**",
            " * Fetch the current user.",
            " * @returns {Promise<User>} The authenticated user.",
            " */",
            "export async function getUser(): Promise<any> { return null; }",
        ].join("\n"));
        const mod = extractModule(f);
        const fn  = mod.functions[0];
        assert.ok(fn.returns, "@returns not extracted");
        assert.ok(fn.returns.description && fn.returns.description.toLowerCase().includes("user"),
            "@returns description wrong: " + fn.returns.description);
    });

    check("extractor: @since and @deprecated extracted on individual items", () => {
        const f = tmp("dep.ts", [
            "/**",
            " * Old helper.",
            " * @since 1.0.0",
            " * @deprecated Use newHelper instead.",
            " */",
            "export function oldHelper(): void {}",
        ].join("\n"));
        const mod = extractModule(f);
        const fn  = mod.functions[0];
        assert.strictEqual(fn.since, "1.0.0", "@since not extracted");
        assert.ok(fn.deprecated != null, "@deprecated not extracted");
    });

    check("extractor: @throws type and description extracted", () => {
        const f = tmp("t.ts", [
            "/**",
            " * Validate input.",
            " * @throws {TypeError} When the value is not a string.",
            " * @throws {RangeError} When the value is empty.",
            " */",
            "export function validate(v: unknown): void {}",
        ].join("\n"));
        const mod = extractModule(f);
        const fn  = mod.functions[0];
        assert.ok(fn.throws && fn.throws.length >= 2, "expected 2 throws tags");
        const te = fn.throws.find(t => t.type === "TypeError");
        assert.ok(te, "TypeError throw not found");
        assert.ok(te.description && te.description.includes("string"), "@throws description wrong");
    });

    check("extractor: 1-based source line numbers recorded on all functions", () => {
        const f = tmp("lines.ts", [
            "export function alpha(): void {}",
            "export function beta(): void {}",
            "export function gamma(): void {}",
        ].join("\n"));
        const mod = extractModule(f);
        assert.ok(mod.functions.length >= 3, "expected 3 functions");
        mod.functions.forEach(fn => {
            assert.ok(typeof fn.line === "number" && fn.line >= 1,
                fn.name + " has no valid line number");
        });
        assert.ok(mod.functions[0].line < mod.functions[1].line, "lines not ordered");
    });

    check("extractor: class — constructor, methods, and properties extracted", () => {
        const f = tmp("cls.ts", [
            "export class Dog {",
            "    name: string;",
            "    private age: number;",
            "    constructor(name: string, age: number) {",
            "        this.name = name; this.age = age;",
            "    }",
            "    bark(): string { return \"woof\"; }",
            "    static create(name: string): Dog { return new Dog(name, 0); }",
            "}",
        ].join("\n"));
        const mod = extractModule(f);
        const cls = mod.classes[0];
        assert.ok(cls, "class not extracted");
        assert.strictEqual(cls.name, "Dog");
        assert.ok(cls.properties.some(p => p.name === "name"), "property 'name' not found");
        assert.ok(cls.methods.some(m => m.name === "bark"), "method 'bark' not found");
        assert.ok(cls.methods.some(m => m.name === "create" && m.isStatic), "static method not found");
        assert.ok(cls.constructor && cls.constructor.params.some(p => p.name === "name"),
            "constructor not extracted");
    });

    check("extractor: interface properties (including optional) extracted", () => {
        const f = tmp("iface.ts", [
            "export interface User {",
            "    id: number;",
            "    name: string;",
            "    email?: string;",
            "}",
        ].join("\n"));
        const mod = extractModule(f);
        const iface = mod.interfaces[0];
        assert.ok(iface, "interface not extracted");
        assert.strictEqual(iface.name, "User");
        assert.strictEqual(iface.properties.length, 3, "expected 3 properties");
        const email = iface.properties.find(p => p.name === "email");
        assert.ok(email && email.optional, "email.optional not set");
    });

    check("extractor: enum members and their values extracted", () => {
        const f = tmp("enm.ts", [
            "export enum Status {",
            "    Active   = \"active\",",
            "    Inactive = \"inactive\",",
            "    Pending  = \"pending\",",
            "}",
        ].join("\n"));
        const mod = extractModule(f);
        const enm = mod.enums[0];
        assert.ok(enm, "enum not extracted");
        assert.strictEqual(enm.name, "Status");
        assert.ok(enm.members.length >= 3, "expected 3 members");
        const active = enm.members.find(m => m.name === "Active");
        assert.ok(active && active.value && active.value.includes("active"), "member value wrong");
    });

    check("extractor: type alias and exported const variable extracted", () => {
        const f = tmp("vars.ts", [
            "export type UserId = string | number;",
            "/** API base URL */",
            "export const BASE_URL: string = \"https://api.example.com\";",
        ].join("\n"));
        const mod = extractModule(f);
        const ta = mod.typeAliases[0];
        assert.ok(ta && ta.name === "UserId", "type alias not extracted");
        assert.ok(ta.type && ta.type.includes("string"), "type alias type string wrong");
        const v = mod.variables.find(x => x.name === "BASE_URL");
        assert.ok(v, "const not extracted");
        assert.ok(v.isConst, "isConst not set");
        assert.ok(v.type && v.type.includes("string"), "const type wrong");
    });

};

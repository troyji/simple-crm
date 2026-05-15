import { describe, it, expect } from "vitest";
import { coerceCustomFields, initCustomFieldState } from "./custom-field-inputs";
import type { CustomField } from "@/types";

function makeField(overrides: Partial<CustomField>): CustomField {
    return { id: 1, name: "field1", label: "Field 1", type: "text", ...overrides };
}

describe("coerceCustomFields", () => {
    it("converts number-type fields from string to number", () => {
        const fields = [makeField({ name: "age", type: "number" })];
        expect(coerceCustomFields(fields, { age: "42" })).toEqual({ age: 42 });
    });

    it("returns 0 when a number-type field has an empty string value", () => {
        const fields = [makeField({ name: "score", type: "number" })];
        expect(coerceCustomFields(fields, { score: "" })).toEqual({ score: 0 });
    });

    it("returns 0 when a number-type field value is non-numeric text", () => {
        const fields = [makeField({ name: "score", type: "number" })];
        expect(coerceCustomFields(fields, { score: "abc" })).toEqual({ score: 0 });
    });

    it("preserves text-type fields as strings", () => {
        const fields = [makeField({ name: "note", type: "text" })];
        expect(coerceCustomFields(fields, { note: "hello" })).toEqual({ note: "hello" });
    });

    it("returns empty string for a missing text-type field", () => {
        const fields = [makeField({ name: "note", type: "text" })];
        expect(coerceCustomFields(fields, {})).toEqual({ note: "" });
    });

    it("handles mixed field types in one call", () => {
        const fields = [
            makeField({ id: 1, name: "label", type: "text" }),
            makeField({ id: 2, name: "amount", type: "number" }),
        ];
        expect(coerceCustomFields(fields, { label: "test", amount: "99.5" })).toEqual({ label: "test", amount: 99.5 });
    });

    it("parses decimal number strings correctly", () => {
        const fields = [makeField({ name: "rate", type: "number" })];
        expect(coerceCustomFields(fields, { rate: "0.75" })).toEqual({ rate: 0.75 });
    });
});

describe("initCustomFieldState", () => {
    it("converts stored number values to strings", () => {
        const fields = [makeField({ name: "age" })];
        expect(initCustomFieldState(fields, { age: 30 })).toEqual({ age: "30" });
    });

    it("preserves stored string values", () => {
        const fields = [makeField({ name: "note" })];
        expect(initCustomFieldState(fields, { note: "hello" })).toEqual({ note: "hello" });
    });

    it("returns empty string for fields not present in stored data", () => {
        const fields = [makeField({ name: "missing" })];
        expect(initCustomFieldState(fields, {})).toEqual({ missing: "" });
    });

    it("returns empty string for all fields when stored is undefined", () => {
        const fields = [makeField({ name: "note" })];
        expect(initCustomFieldState(fields, undefined)).toEqual({ note: "" });
    });

    it("converts stored decimal number to string", () => {
        const fields = [makeField({ name: "amount" })];
        expect(initCustomFieldState(fields, { amount: 42.5 })).toEqual({ amount: "42.5" });
    });

    it("initializes multiple fields correctly", () => {
        const fields = [
            makeField({ id: 1, name: "a" }),
            makeField({ id: 2, name: "b" }),
        ];
        expect(initCustomFieldState(fields, { a: "x", b: 7 })).toEqual({ a: "x", b: "7" });
    });
});

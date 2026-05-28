import { describe, it, expect } from "vitest";
import { computeInsertPosition, needsRenormalization } from "./pipeline-position";

describe("computeInsertPosition", () => {
    it("returns 1 for an empty column", () => {
        expect(computeInsertPosition([], 0)).toBe(1);
    });

    it("returns 1 for an empty column even when toIndex is large", () => {
        expect(computeInsertPosition([], 5)).toBe(1);
    });

    it("places before the first item when toIndex is 0", () => {
        expect(computeInsertPosition([{ position: 1 }, { position: 2 }], 0)).toBe(0);
    });

    it("places before the first item when toIndex is negative", () => {
        expect(computeInsertPosition([{ position: 1 }], -1)).toBe(0);
    });

    it("appends to the end when toIndex equals length", () => {
        expect(computeInsertPosition([{ position: 1 }, { position: 2 }], 2)).toBe(3);
    });

    it("appends to the end when toIndex exceeds length", () => {
        expect(computeInsertPosition([{ position: 1 }, { position: 2 }], 99)).toBe(3);
    });

    it("places between two items at the midpoint", () => {
        expect(computeInsertPosition([{ position: 1 }, { position: 2 }, { position: 3 }], 1)).toBe(1.5);
    });

    it("handles non-integer positions when computing midpoint", () => {
        expect(computeInsertPosition([{ position: 1 }, { position: 1.5 }, { position: 2 }], 1)).toBe(1.25);
    });

    it("handles negative neighbor positions", () => {
        expect(computeInsertPosition([{ position: -5 }, { position: 5 }], 1)).toBe(0);
    });
});

describe("needsRenormalization", () => {
    it("is false for an empty column", () => {
        expect(needsRenormalization([], 0)).toBe(false);
    });

    it("is false when inserting at the ends (no neighbors on both sides)", () => {
        expect(needsRenormalization([{ position: 1 }, { position: 2 }], 0)).toBe(false);
        expect(needsRenormalization([{ position: 1 }, { position: 2 }], 2)).toBe(false);
    });

    it("is false when neighbors are well-separated", () => {
        expect(needsRenormalization([{ position: 1 }, { position: 2 }, { position: 3 }], 1)).toBe(false);
    });

    it("is true when neighbors are within epsilon of each other", () => {
        expect(needsRenormalization([{ position: 1 }, { position: 1 + 1e-9 }, { position: 2 }], 1)).toBe(true);
    });
});

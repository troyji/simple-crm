import { describe, it, expect } from "vitest";
import { computeInsertPosition } from "./pipeline-position";

describe("computeInsertPosition", () => {
    it("returns a key for an empty column", () => {
        expect(computeInsertPosition([], 0).length).toBeGreaterThan(0);
    });

    it("places before the first item when toIndex is 0", () => {
        const k = computeInsertPosition([{ position: "a1" }, { position: "a2" }], 0);
        expect(k < "a1").toBe(true);
    });

    it("places before the first item when toIndex is negative", () => {
        const k = computeInsertPosition([{ position: "a1" }], -1);
        expect(k < "a1").toBe(true);
    });

    it("appends to the end when toIndex equals length", () => {
        const k = computeInsertPosition([{ position: "a1" }, { position: "a2" }], 2);
        expect(k > "a2").toBe(true);
    });

    it("appends to the end when toIndex exceeds length", () => {
        const k = computeInsertPosition([{ position: "a1" }, { position: "a2" }], 99);
        expect(k > "a2").toBe(true);
    });

    it("places strictly between two neighbours", () => {
        const k = computeInsertPosition(
            [{ position: "a1" }, { position: "a2" }, { position: "a3" }],
            1,
        );
        expect(k > "a1").toBe(true);
        expect(k < "a2").toBe(true);
    });

    it("can subdivide between adjacent keys without exhausting space", () => {
        let lo = "a1";
        let hi = "a2";
        for (let i = 0; i < 50; i++) {
            const mid = computeInsertPosition([{ position: lo }, { position: hi }], 1);
            expect(mid > lo).toBe(true);
            expect(mid < hi).toBe(true);
            if (i % 2 === 0) hi = mid;
            else lo = mid;
        }
    });
});

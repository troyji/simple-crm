import { describe, it, expect } from "vitest";
import { resolveLikelihood, computeExpectedValue } from "./expected-value";
import type { LikelihoodSettings } from "./expected-value";
import type { Stage } from "../entity/Stage";

function makeStage(overrides: Partial<Stage>): Stage {
    return {
        id: 1,
        name: "Test Stage",
        status: "pending",
        conversionLikelihood: 0.5,
        order: 1,
        opportunities: [],
        ...overrides,
    } as Stage;
}

const defaults: LikelihoodSettings = { wonLikelihood: 1, lostLikelihood: 0 };

describe("resolveLikelihood", () => {
    it("returns wonLikelihood when stage status is 'won'", () => {
        expect(resolveLikelihood(makeStage({ status: "won", conversionLikelihood: 0.3 }), defaults)).toBe(1);
    });

    it("returns lostLikelihood when stage status is 'lost'", () => {
        expect(resolveLikelihood(makeStage({ status: "lost", conversionLikelihood: 0.9 }), defaults)).toBe(0);
    });

    it("returns stage.conversionLikelihood when status is 'pending'", () => {
        expect(resolveLikelihood(makeStage({ status: "pending", conversionLikelihood: 0.65 }), defaults)).toBe(0.65);
    });

    it("returns 0 for a pending stage with 0% conversionLikelihood", () => {
        expect(resolveLikelihood(makeStage({ status: "pending", conversionLikelihood: 0 }), defaults)).toBe(0);
    });

    it("returns 1 for a pending stage with 100% conversionLikelihood", () => {
        expect(resolveLikelihood(makeStage({ status: "pending", conversionLikelihood: 1 }), defaults)).toBe(1);
    });

    it("uses the configured wonLikelihood value, not a hardcoded 1", () => {
        const settings: LikelihoodSettings = { wonLikelihood: 0.9, lostLikelihood: 0.1 };
        expect(resolveLikelihood(makeStage({ status: "won" }), settings)).toBe(0.9);
    });

    it("uses the configured lostLikelihood value, not a hardcoded 0", () => {
        const settings: LikelihoodSettings = { wonLikelihood: 0.9, lostLikelihood: 0.1 };
        expect(resolveLikelihood(makeStage({ status: "lost" }), settings)).toBe(0.1);
    });
});

describe("computeExpectedValue", () => {
    it("multiplies value by conversionLikelihood for a pending stage", () => {
        expect(computeExpectedValue(1000, makeStage({ status: "pending", conversionLikelihood: 0.4 }), defaults)).toBe(400);
    });

    it("returns full value for a won stage with wonLikelihood of 1", () => {
        expect(computeExpectedValue(5000, makeStage({ status: "won" }), defaults)).toBe(5000);
    });

    it("returns zero for a lost stage with lostLikelihood of 0", () => {
        expect(computeExpectedValue(5000, makeStage({ status: "lost" }), defaults)).toBe(0);
    });

    it("returns 0 when value is 0", () => {
        expect(computeExpectedValue(0, makeStage({ status: "pending", conversionLikelihood: 0.8 }), defaults)).toBe(0);
    });

    it("handles fractional likelihood without floating-point precision failures", () => {
        expect(computeExpectedValue(300, makeStage({ status: "pending", conversionLikelihood: 1 / 3 }), defaults)).toBeCloseTo(100, 10);
    });

    it("handles large values", () => {
        expect(computeExpectedValue(1_000_000, makeStage({ status: "pending", conversionLikelihood: 0.5 }), defaults)).toBe(500_000);
    });

    it("returns partial value for a won stage when wonLikelihood is less than 1", () => {
        const settings: LikelihoodSettings = { wonLikelihood: 0.75, lostLikelihood: 0 };
        expect(computeExpectedValue(1000, makeStage({ status: "won" }), settings)).toBe(750);
    });

    it("returns non-zero for a lost stage when lostLikelihood is non-zero", () => {
        const settings: LikelihoodSettings = { wonLikelihood: 1, lostLikelihood: 0.1 };
        expect(computeExpectedValue(1000, makeStage({ status: "lost" }), settings)).toBe(100);
    });
});

import { describe, it, expect } from "vitest";
import {
    parseLocalDate,
    formatCurrency,
    calcExpectedValue,
    getBucketLabel,
    groupOpps,
    sortOpps,
} from "./forecast.utils";
import type { Opportunity, Stage } from "@/types";

function makeStage(overrides: Partial<Stage> = {}): Stage {
    return { id: 1, name: "Stage A", status: "pending", conversionLikelihood: 0.5, order: 1, ...overrides };
}

function makeOpp(overrides: Partial<Opportunity> = {}): Opportunity {
    return {
        id: 1,
        lead: { id: 1, firstName: "John", lastName: "Doe", age: 70, phoneNumber: "555-0100" },
        stage: makeStage(),
        value: 1000,
        expectedCloseDate: null,
        ...overrides,
    };
}

describe("parseLocalDate", () => {
    it("parses YYYY-MM-DD into the correct local year, month, and day", () => {
        const d = parseLocalDate("2025-06-15");
        expect(d.getFullYear()).toBe(2025);
        expect(d.getMonth()).toBe(5); // June = index 5
        expect(d.getDate()).toBe(15);
    });

    it("does not shift the day due to UTC offset", () => {
        // new Date("2025-01-01") is parsed as UTC midnight and can land on Dec 31
        // in negative-offset timezones. parseLocalDate must always return Jan 1.
        const d = parseLocalDate("2025-01-01");
        expect(d.getDate()).toBe(1);
        expect(d.getMonth()).toBe(0);
    });
});

describe("formatCurrency", () => {
    it("formats whole dollar amounts with two decimal places", () => {
        expect(formatCurrency(1000)).toBe("$1,000.00");
    });

    it("formats zero", () => {
        expect(formatCurrency(0)).toBe("$0.00");
    });

    it("formats cents correctly", () => {
        expect(formatCurrency(99.99)).toBe("$99.99");
    });

    it("formats large values with comma separators", () => {
        expect(formatCurrency(1_234_567)).toBe("$1,234,567.00");
    });
});

describe("calcExpectedValue", () => {
    it("returns 0 for an empty array", () => {
        expect(calcExpectedValue([])).toBe(0);
    });

    it("sums value × conversionLikelihood across all opportunities", () => {
        const opps = [
            makeOpp({ value: 1000, stage: makeStage({ conversionLikelihood: 0.5 }) }),
            makeOpp({ id: 2, value: 2000, stage: makeStage({ conversionLikelihood: 0.25 }) }),
        ];
        // 500 + 500 = 1000
        expect(calcExpectedValue(opps)).toBe(1000);
    });

    it("handles a single opportunity", () => {
        const opps = [makeOpp({ value: 500, stage: makeStage({ conversionLikelihood: 0.8 }) })];
        expect(calcExpectedValue(opps)).toBe(400);
    });
});

describe("getBucketLabel", () => {
    it("returns 'Previous & Overdue' for the 'prev' bucket key", () => {
        expect(getBucketLabel("prev", 2025, 0)).toBe("Previous & Overdue");
    });

    it("returns 'Beyond' for the 'beyond' bucket key", () => {
        expect(getBucketLabel("beyond", 2025, 0)).toBe("Beyond");
    });

    it("returns the current month name for offset 0", () => {
        expect(getBucketLabel(0, 2025, 0)).toBe("January 2025");
    });

    it("returns the next month name for offset 1", () => {
        expect(getBucketLabel(1, 2025, 0)).toBe("February 2025");
    });

    it("wraps the year correctly when month + offset crosses December", () => {
        // month=11 (December) + offset=2 → February of the following year
        expect(getBucketLabel(2, 2025, 11)).toBe("February 2026");
    });
});

describe("sortOpps", () => {
    it("places opportunities with dates before those without", () => {
        const a = makeOpp({ id: 1, expectedCloseDate: "2025-03-01" });
        const b = makeOpp({ id: 2, expectedCloseDate: null });
        expect(sortOpps([b, a]).map(o => o.id)).toEqual([1, 2]);
    });

    it("sorts by date ascending when both have dates", () => {
        const a = makeOpp({ id: 1, expectedCloseDate: "2025-06-01" });
        const b = makeOpp({ id: 2, expectedCloseDate: "2025-03-01" });
        expect(sortOpps([a, b]).map(o => o.id)).toEqual([2, 1]);
    });

    it("preserves relative order when neither has a date", () => {
        const a = makeOpp({ id: 1, expectedCloseDate: null });
        const b = makeOpp({ id: 2, expectedCloseDate: null });
        expect(sortOpps([a, b]).map(o => o.id)).toEqual([1, 2]);
    });

    it("does not mutate the original array", () => {
        const a = makeOpp({ id: 1, expectedCloseDate: "2025-06-01" });
        const b = makeOpp({ id: 2, expectedCloseDate: "2025-03-01" });
        const original = [a, b];
        sortOpps(original);
        expect(original[0].id).toBe(1);
    });
});

describe("groupOpps", () => {
    it("groups opportunities by their custom field value", () => {
        const a = makeOpp({ id: 1, customFields: { tier: "Gold" } });
        const b = makeOpp({ id: 2, customFields: { tier: "Silver" } });
        const c = makeOpp({ id: 3, customFields: { tier: "Gold" } });
        const result = groupOpps([a, b, c], "tier", "opportunity");
        expect(result.get("Gold")).toHaveLength(2);
        expect(result.get("Silver")).toHaveLength(1);
    });

    it("groups by a lead custom field when fieldEntity is 'lead'", () => {
        const a = makeOpp({ id: 1, lead: { id: 1, firstName: "A", lastName: "B", age: 70, phoneNumber: "", customFields: { region: "West" } } });
        const b = makeOpp({ id: 2, lead: { id: 2, firstName: "C", lastName: "D", age: 72, phoneNumber: "", customFields: { region: "East" } } });
        const result = groupOpps([a, b], "region", "lead");
        expect(result.has("West")).toBe(true);
        expect(result.has("East")).toBe(true);
    });

    it("places opportunities with a missing field value under '(No value)'", () => {
        const a = makeOpp({ id: 1, customFields: {} });
        const result = groupOpps([a], "tier", "opportunity");
        expect(result.has("(No value)")).toBe(true);
    });

    it("places opportunities with an empty string field value under '(No value)'", () => {
        const a = makeOpp({ id: 1, customFields: { tier: "" } });
        const result = groupOpps([a], "tier", "opportunity");
        expect(result.has("(No value)")).toBe(true);
    });

    it("sorts '(No value)' group to the end regardless of alphabetical position", () => {
        const a = makeOpp({ id: 1, customFields: { tier: "" } });
        const b = makeOpp({ id: 2, customFields: { tier: "Alpha" } });
        const keys = [...groupOpps([a, b], "tier", "opportunity").keys()];
        expect(keys[keys.length - 1]).toBe("(No value)");
    });

    it("sorts named groups alphabetically", () => {
        const a = makeOpp({ id: 1, customFields: { tier: "Zebra" } });
        const b = makeOpp({ id: 2, customFields: { tier: "Alpha" } });
        const keys = [...groupOpps([a, b], "tier", "opportunity").keys()];
        expect(keys[0]).toBe("Alpha");
        expect(keys[1]).toBe("Zebra");
    });
});

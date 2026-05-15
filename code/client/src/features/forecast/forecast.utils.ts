import type { Opportunity } from "@/types";

export type BucketKey = "prev" | 0 | 1 | 2 | 3 | 4 | 5 | "beyond";
export const BUCKET_KEYS: BucketKey[] = ["prev", 0, 1, 2, 3, 4, 5, "beyond"];

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

export function parseLocalDate(s: string): Date {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
}

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export function formatDate(s: string | null | undefined): string {
    if (!s) return "—";
    return parseLocalDate(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function calcExpectedValue(opps: Opportunity[]): number {
    return opps.reduce((sum, opp) => sum + opp.value * opp.stage.conversionLikelihood, 0);
}

export function getBucketLabel(key: BucketKey, year: number, month: number): string {
    if (key === "prev") return "Previous & Overdue";
    if (key === "beyond") return "Beyond";
    const d = new Date(year, month + key, 1);
    return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export function groupOpps(opps: Opportunity[], fieldName: string, fieldEntity: string | undefined): Map<string, Opportunity[]> {
    const groups = new Map<string, Opportunity[]>();
    for (const opp of opps) {
        const raw = fieldEntity === "lead"
            ? opp.lead.customFields?.[fieldName]
            : opp.customFields?.[fieldName];
        const key = raw !== undefined && raw !== null && raw !== "" ? String(raw) : "(No value)";
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(opp);
    }
    return new Map(
        [...groups.entries()].sort(([a], [b]) => {
            if (a === "(No value)") return 1;
            if (b === "(No value)") return -1;
            return a.localeCompare(b);
        })
    );
}

export function sortOpps(opps: Opportunity[]): Opportunity[] {
    return [...opps].sort((a, b) => {
        if (!a.expectedCloseDate && !b.expectedCloseDate) return 0;
        if (!a.expectedCloseDate) return 1;
        if (!b.expectedCloseDate) return -1;
        return parseLocalDate(a.expectedCloseDate).getTime() - parseLocalDate(b.expectedCloseDate).getTime();
    });
}

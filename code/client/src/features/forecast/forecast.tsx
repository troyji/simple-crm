import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Opportunity, Stage } from "@/types";
import { fetchOpportunities } from "@/api/opportunities";
import { fetchStages } from "@/api/stages";
import { QUERY_KEYS } from "@/api/query-keys";
import { Button } from "@/components/ui/button";
import { Collapsible } from "@/components/ui/collapsible";
import { StageFilter } from "./stage-filter";

type BucketKey = "prev" | 0 | 1 | 2 | 3 | 4 | 5 | "beyond";
const BUCKET_KEYS: BucketKey[] = ["prev", 0, 1, 2, 3, 4, 5, "beyond"];

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

function parseLocalDate(s: string): Date {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function formatDate(s: string | null | undefined): string {
    if (!s) return "—";
    return parseLocalDate(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function calcExpectedValue(opps: Opportunity[]): number {
    return opps.reduce((sum, opp) => sum + opp.value * opp.stage.conversionLikelihood, 0);
}

function getBucketLabel(key: BucketKey, year: number, month: number): string {
    if (key === "prev") return "Previous & Overdue";
    if (key === "beyond") return "Beyond";
    const d = new Date(year, month + key, 1);
    return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function sortOpps(opps: Opportunity[]): Opportunity[] {
    return [...opps].sort((a, b) => {
        if (!a.expectedCloseDate && !b.expectedCloseDate) return 0;
        if (!a.expectedCloseDate) return 1;
        if (!b.expectedCloseDate) return -1;
        return parseLocalDate(a.expectedCloseDate).getTime() - parseLocalDate(b.expectedCloseDate).getTime();
    });
}

export function Forecast() {
    const { data: opportunities = [], isPending: oppsLoading } = useQuery<Opportunity[]>({
        queryKey: QUERY_KEYS.opportunities,
        queryFn: fetchOpportunities,
    });
    const { data: stages = [], isPending: stagesLoading } = useQuery<Stage[]>({
        queryKey: QUERY_KEYS.stages,
        queryFn: fetchStages,
    });

    const [filtersInitialized, setFiltersInitialized] = useState(false);
    const [appliedFilter, setAppliedFilter] = useState<Set<number>>(new Set());
    const [pendingFilter, setPendingFilter] = useState<Set<number>>(new Set());
    const [filterOpen, setFilterOpen] = useState(false);
    const [openBuckets, setOpenBuckets] = useState<Set<BucketKey>>(new Set());

    useEffect(() => {
        if (!filtersInitialized && stages.length > 0) {
            const defaultSet = new Set(stages.filter(s => s.status === "pending").map(s => s.id));
            setAppliedFilter(defaultSet);
            setPendingFilter(defaultSet);
            setFiltersInitialized(true);
        }
    }, [stages, filtersInitialized]);

    const openFilter = () => {
        setPendingFilter(new Set(appliedFilter));
        setFilterOpen(true);
    };
    const closeFilter = () => setFilterOpen(false);
    const togglePending = (stageId: number) => {
        setPendingFilter(prev => {
            const next = new Set(prev);
            next.has(stageId) ? next.delete(stageId) : next.add(stageId);
            return next;
        });
    };
    const applyFilter = () => {
        setAppliedFilter(new Set(pendingFilter));
        setFilterOpen(false);
    };

    const expandAll = () => setOpenBuckets(new Set(BUCKET_KEYS));
    const collapseAll = () => setOpenBuckets(new Set());
    const toggleBucket = (key: BucketKey) => {
        setOpenBuckets(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const buckets = useMemo(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const currentMonthStart = new Date(year, month, 1);
        const beyondStart = new Date(year, month + 6, 1);

        const result: Record<BucketKey, Opportunity[]> = {
            prev: [], 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], beyond: [],
        };

        for (const opp of opportunities) {
            if (!appliedFilter.has(opp.stage.id)) continue;

            if (!opp.expectedCloseDate) {
                result["beyond"].push(opp);
                continue;
            }

            const date = parseLocalDate(opp.expectedCloseDate);

            if (date < currentMonthStart) {
                result["prev"].push(opp);
            } else if (date >= beyondStart) {
                result["beyond"].push(opp);
            } else {
                for (let i = 0; i <= 5; i++) {
                    const bStart = new Date(year, month + i, 1);
                    const bEnd = new Date(year, month + i + 1, 1);
                    if (date >= bStart && date < bEnd) {
                        (result[i as 0 | 1 | 2 | 3 | 4 | 5]).push(opp);
                        break;
                    }
                }
            }
        }

        for (const key of BUCKET_KEYS) {
            result[key] = sortOpps(result[key]);
        }

        return result;
    }, [opportunities, appliedFilter]);

    if (oppsLoading || stagesLoading) return <p>Loading forecast...</p>;

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Monthly Forecast</h2>
                <div className="flex items-center gap-2">
                    <StageFilter
                        stages={stages}
                        pendingFilter={pendingFilter}
                        filterOpen={filterOpen}
                        onOpen={openFilter}
                        onClose={closeFilter}
                        onTogglePending={togglePending}
                        onApply={applyFilter}
                    />
                    <Button variant="outline" size="sm" onClick={expandAll}>Expand All</Button>
                    <Button variant="outline" size="sm" onClick={collapseAll}>Collapse All</Button>
                </div>
            </div>

            {BUCKET_KEYS.map(key => {
                const opps = buckets[key];
                const label = getBucketLabel(key, year, month);
                return (
                    <Collapsible
                        key={String(key)}
                        isOpen={openBuckets.has(key)}
                        onToggle={() => toggleBucket(key)}
                        header={
                            <div className="flex items-center gap-4">
                                <span className="font-semibold">{label}</span>
                                <span className="text-sm text-gray-500">{opps.length} {opps.length === 1 ? "opportunity" : "opportunities"}</span>
                                <span className="text-sm font-medium text-blue-700">{formatCurrency(calcExpectedValue(opps))}</span>
                            </div>
                        }
                    >
                        {opps.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-gray-400 italic">No opportunities</p>
                        ) : (
                            <table className="table-auto w-full border-collapse text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-left">
                                        <th className="border px-3 py-2">Lead Name</th>
                                        <th className="border px-3 py-2">Stage</th>
                                        <th className="border px-3 py-2 text-right">Value</th>
                                        <th className="border px-3 py-2 text-right">Expected Close</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {opps.map(opp => (
                                        <tr key={opp.id} className="hover:bg-gray-50">
                                            <td className="border px-3 py-2">{opp.lead.firstName} {opp.lead.lastName}</td>
                                            <td className="border px-3 py-2">{opp.stage.name}</td>
                                            <td className="border px-3 py-2 text-right font-mono">{formatCurrency(opp.value)}</td>
                                            <td className="border px-3 py-2 text-right font-mono">{formatDate(opp.expectedCloseDate)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </Collapsible>
                );
            })}
        </div>
    );
}

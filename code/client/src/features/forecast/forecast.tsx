import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Opportunity, Stage, CustomField } from "@/types";
import { fetchOpportunities } from "@/api/opportunities";
import { fetchStages } from "@/api/stages";
import { fetchCustomFields } from "@/api/custom-fields";
import { fetchSettings } from "@/api/settings";
import { QUERY_KEYS } from "@/api/query-keys";
import type { AppSetting } from "@/types";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Collapsible } from "@/components/ui/collapsible";
import { StageFilter } from "./stage-filter";
import type { BucketKey, LikelihoodSettings } from "./forecast.utils";
import {
    BUCKET_KEYS,
    parseLocalDate,
    formatCurrency,
    formatDate,
    calcTotalValue,
    calcExpectedValue,
    resolveLikelihood,
    getBucketLabel,
    groupOpps,
    sortOpps,
} from "./forecast.utils";

export function Forecast() {
    const { data: opportunities = [], isPending: oppsLoading } = useQuery<Opportunity[]>({
        queryKey: QUERY_KEYS.opportunities,
        queryFn: fetchOpportunities,
    });
    const { data: stages = [], isPending: stagesLoading } = useQuery<Stage[]>({
        queryKey: QUERY_KEYS.stages,
        queryFn: fetchStages,
    });
    const { data: customFields = [], isPending: fieldsLoading } = useQuery<CustomField[]>({
        queryKey: QUERY_KEYS.customFields,
        queryFn: fetchCustomFields,
    });
    const { data: settings = [], isPending: settingsLoading } = useQuery<AppSetting[]>({
        queryKey: QUERY_KEYS.settings,
        queryFn: fetchSettings,
    });

    const likelihoodSettings: LikelihoodSettings = useMemo(() => {
        const get = (key: string, fallback: number) => {
            const s = settings.find(s => s.key === key);
            const n = s ? parseFloat(s.value) : NaN;
            return isNaN(n) ? fallback : n;
        };
        return {
            wonLikelihood: get("wonStageLikelihood", 1),
            lostLikelihood: get("lostStageLikelihood", 0),
        };
    }, [settings]);

    const [groupByField, setGroupByField] = useState<string>("");
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

    const buckets = useMemo<Record<BucketKey, Opportunity[]>>(() => {
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

    if (oppsLoading || stagesLoading || fieldsLoading || settingsLoading) return <p>Loading forecast...</p>;

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
                    <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-600 whitespace-nowrap">Group by</span>
                        <Select
                            value={groupByField}
                            onChange={e => setGroupByField(e.target.value)}
                            className="text-sm py-1 w-36"
                        >
                            <option value="">None</option>
                            {customFields.filter(f => f.entity === "opportunity").map(f => (
                                <option key={f.id} value={f.name}>{f.label}</option>
                            ))}
                        </Select>
                    </div>
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
                                <span className="text-sm text-gray-500">Total: {formatCurrency(calcTotalValue(opps))}</span>
                                <span className="text-sm font-medium text-blue-700">Expected Value: {formatCurrency(calcExpectedValue(opps, likelihoodSettings))}</span>
                            </div>
                        }
                    >
                        {opps.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-gray-400 italic">No opportunities</p>
                        ) : (() => {
                            const selectedField = groupByField ? customFields.find(f => f.name === groupByField) : undefined;
                            const groups = selectedField
                                ? groupOpps(opps, groupByField, selectedField.entity)
                                : null;
                            return (
                                <table className="table-auto w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 text-left">
                                            <th className="border px-3 py-2">Lead Name</th>
                                            <th className="border px-3 py-2">Stage</th>
                                            <th className="border px-3 py-2 text-right">Value</th>
                                            <th className="border px-3 py-2 text-right">Conv. %</th>
                                            <th className="border px-3 py-2 text-right">Expected Value</th>
                                            <th className="border px-3 py-2 text-right">Expected Close</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedField ? (
                                            [...groups!.entries()].map(([groupLabel, groupedOpps]) => (
                                                <React.Fragment key={groupLabel}>
                                                    <tr className="bg-gray-100">
                                                        <td colSpan={6} className="border px-3 py-1.5 text-sm font-medium text-gray-700">
                                                            {selectedField.label}: {groupLabel}
                                                            <span className="ml-3 font-normal text-gray-500">
                                                                {groupedOpps.length} {groupedOpps.length === 1 ? "opportunity" : "opportunities"}
                                                                {" · "}
                                                                Total: {formatCurrency(calcTotalValue(groupedOpps))}
                                                                {" · "}
                                                                Expected: {formatCurrency(calcExpectedValue(groupedOpps, likelihoodSettings))}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    {groupedOpps.map(opp => {
                                                        const likelihood = resolveLikelihood(opp, likelihoodSettings);
                                                        return (
                                                        <tr key={opp.id} className="hover:bg-gray-50">
                                                            <td className="border px-3 py-2">{opp.lead.firstName} {opp.lead.lastName}</td>
                                                            <td className="border px-3 py-2">{opp.stage.name}</td>
                                                            <td className="border px-3 py-2 text-right font-mono">{formatCurrency(opp.value)}</td>
                                                            <td className="border px-3 py-2 text-right font-mono">{(likelihood * 100).toFixed(0)}%</td>
                                                            <td className="border px-3 py-2 text-right font-mono">{formatCurrency(opp.value * likelihood)}</td>
                                                            <td className="border px-3 py-2 text-right font-mono">{formatDate(opp.expectedCloseDate)}</td>
                                                        </tr>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            ))
                                        ) : (
                                            opps.map(opp => {
                                                const likelihood = resolveLikelihood(opp, likelihoodSettings);
                                                return (
                                                <tr key={opp.id} className="hover:bg-gray-50">
                                                    <td className="border px-3 py-2">{opp.lead.firstName} {opp.lead.lastName}</td>
                                                    <td className="border px-3 py-2">{opp.stage.name}</td>
                                                    <td className="border px-3 py-2 text-right font-mono">{formatCurrency(opp.value)}</td>
                                                    <td className="border px-3 py-2 text-right font-mono">{(likelihood * 100).toFixed(0)}%</td>
                                                    <td className="border px-3 py-2 text-right font-mono">{formatCurrency(opp.value * likelihood)}</td>
                                                    <td className="border px-3 py-2 text-right font-mono">{formatDate(opp.expectedCloseDate)}</td>
                                                </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            );
                        })()}
                    </Collapsible>
                );
            })}
        </div>
    );
}

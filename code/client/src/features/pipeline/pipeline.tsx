import { useQuery } from "@tanstack/react-query";
import type { PipelineReport } from "@/types";
import { fetchPipeline } from "@/api/pipeline";
import { QUERY_KEYS } from "@/api/query-keys";
import { Card } from "@/components/ui/card";
import { PipelineBoard } from "./pipeline-board";

export function Pipeline() {
    const { data: report, isPending } = useQuery<PipelineReport>({ queryKey: QUERY_KEYS.pipeline, queryFn: fetchPipeline });

    if (isPending) return <p>Loading pipeline...</p>;
    if (!report) return <p>No pipeline data</p>;

    const formatCurrency = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Pipeline</h2>

            <div className="grid grid-cols-2 gap-4">
                <Card variant="info">
                    <p className="text-sm text-gray-600">Total Pipeline Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(report.totalValue)}</p>
                </Card>
                <Card variant="success">
                    <p className="text-sm text-gray-600">Expected Close Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(report.expectedValue)}</p>
                </Card>
            </div>

            <PipelineBoard />
        </div>
    );
}

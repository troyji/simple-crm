import { useQuery } from "@tanstack/react-query";
import type { PipelineReport } from "@/types";
import { fetchPipeline } from "@/api/pipeline";
import { QUERY_KEYS } from "@/api/query-keys";
import { Card } from "@/components/ui/card";

export function Pipeline() {
    const { data: report, isPending } = useQuery<PipelineReport>({ queryKey: QUERY_KEYS.pipeline, queryFn: fetchPipeline });

    if (isPending) return <p>Loading pipeline...</p>;
    if (!report) return <p>No pipeline data</p>;

    const formatCurrency = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
    const formatPercent = (value: number) => `${(value * 100).toFixed(0)}%`;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Pipeline Report</h2>

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

            <table className="table-auto w-full border-collapse border border-gray-300">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Stage</th>
                        <th className="border p-2 text-right">Count</th>
                        <th className="border p-2 text-right">Pipeline $</th>
                        <th className="border p-2 text-right">Likelihood</th>
                        <th className="border p-2 text-right">Expected $</th>
                    </tr>
                </thead>
                <tbody>
                    {report.byStage.map(item => {
                        const bgClass = item.stage.status === "won" ? "bg-green-50" : item.stage.status === "lost" ? "bg-red-50" : "";
                        return (
                            <tr key={item.stage.id} className={bgClass}>
                                <td className="border p-2">
                                    <span className="font-medium">{item.stage.name}</span>
                                    <span className="text-xs text-gray-500 ml-2">({item.stage.status})</span>
                                </td>
                                <td className="border p-2 text-right">{item.count}</td>
                                <td className="border p-2 text-right font-mono">{formatCurrency(item.totalValue)}</td>
                                <td className="border p-2 text-right font-mono">{formatPercent(item.stage.conversionLikelihood)}</td>
                                <td className="border p-2 text-right font-mono font-bold">{formatCurrency(item.expectedValue)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

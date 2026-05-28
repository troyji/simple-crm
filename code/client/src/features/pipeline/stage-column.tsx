import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Opportunity, Stage } from "@/types";
import { OpportunityTile } from "./opportunity-tile";

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const formatPercent = (value: number) => `${(value * 100).toFixed(0)}%`;

const HEADER_BG: Record<Stage["status"], string> = {
    pending: "bg-gray-100",
    won: "bg-green-100",
    lost: "bg-red-100",
};

interface Props {
    stage: Stage;
    opps: Opportunity[];
    pipelineTotal: number;
    expectedTotal: number;
}

export function StageColumn({ stage, opps, pipelineTotal, expectedTotal }: Props) {
    const { setNodeRef, isOver } = useDroppable({
        id: `stage-${stage.id}`,
        data: { stageId: stage.id, type: "stage-dropzone" },
    });

    return (
        <div className="flex-shrink-0 w-72 flex flex-col">
            <div className={`sticky top-14 z-20 p-3 rounded-t-lg border border-zinc-200 ${HEADER_BG[stage.status]}`}>
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{stage.name}</h3>
                    <span className="text-xs uppercase tracking-wide text-gray-600">{stage.status}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-700">
                    <div>Count</div>
                    <div className="text-right font-mono">{opps.length}</div>
                    <div>Pipeline $</div>
                    <div className="text-right font-mono">{formatCurrency(pipelineTotal)}</div>
                    <div>Likelihood</div>
                    <div className="text-right font-mono">{formatPercent(stage.conversionLikelihood)}</div>
                    <div>Expected $</div>
                    <div className="text-right font-mono font-semibold">{formatCurrency(expectedTotal)}</div>
                </div>
            </div>
            <div className={`flex-1 rounded-b-lg ${isOver ? "bg-blue-50" : "bg-gray-50"}`}>
                <SortableContext items={opps.map(o => o.id)} strategy={verticalListSortingStrategy}>
                    <div ref={setNodeRef} className="p-2 space-y-2 min-h-[120px]">
                        {opps.length === 0 ? (
                            <div className="text-xs text-gray-400 text-center py-6 border-2 border-dashed rounded">
                                Drop opportunities here
                            </div>
                        ) : (
                            opps.map(opp => <OpportunityTile key={opp.id} opp={opp} />)
                        )}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
}

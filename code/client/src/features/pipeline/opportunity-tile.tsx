import { useState, type PointerEvent as ReactPointerEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CustomField, Opportunity } from "@/types";
import { fetchCustomFields } from "@/api/custom-fields";
import { updateOpportunity } from "@/api/opportunities";
import { QUERY_KEYS } from "@/api/query-keys";
import { Dialog } from "@/components/ui/dialog";
import { initCustomFieldState } from "@/components/custom-field-inputs";
import { OpportunityForm, type OpportunitySubmitValues } from "@/features/leads/opportunity-form";

const formatDate = (s: string | null | undefined) => {
    if (!s) return null;
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

export function TilePresentation({ opp, withViewDetails, onViewDetails }: {
    opp: Opportunity;
    withViewDetails: boolean;
    onViewDetails?: (e: ReactPointerEvent | React.MouseEvent) => void;
}) {
    const closeDate = formatDate(opp.expectedCloseDate);
    return (
        <div className="bg-white border rounded p-3 shadow-sm hover:shadow cursor-grab active:cursor-grabbing">
            <div className="font-medium text-sm">{opp.lead.firstName} {opp.lead.lastName}</div>
            <div className="text-sm text-gray-700 mt-0.5">{opp.name || "Unnamed opportunity"}</div>
            {closeDate && (
                <div className="text-xs text-gray-500 mt-1">Closes: {closeDate}</div>
            )}
            {withViewDetails && (
                <button
                    type="button"
                    onPointerDown={e => e.stopPropagation()}
                    onClick={onViewDetails}
                    className="mt-2 text-sm text-blue-600 underline cursor-pointer"
                >
                    View details
                </button>
            )}
        </div>
    );
}

interface Props {
    opp: Opportunity;
}

export function OpportunityTile({ opp }: Props) {
    const queryClient = useQueryClient();
    const [showDetails, setShowDetails] = useState(false);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: opp.id,
        data: { stageId: opp.stage.id },
    });

    const { data: allCustomFields = [] } = useQuery<CustomField[]>({
        queryKey: QUERY_KEYS.customFields,
        queryFn: fetchCustomFields,
    });
    const oppFields = allCustomFields.filter(f => f.entity === "opportunity");

    const updateMutation = useMutation({
        mutationFn: updateOpportunity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.opportunities });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pipeline });
            setShowDetails(false);
        },
    });

    return (
        <>
            <div
                ref={setNodeRef}
                style={{
                    transform: CSS.Transform.toString(transform),
                    transition,
                    opacity: isDragging ? 0.4 : 1,
                }}
                {...attributes}
                {...listeners}
            >
                <TilePresentation
                    opp={opp}
                    withViewDetails
                    onViewDetails={e => {
                        e.stopPropagation();
                        setShowDetails(true);
                    }}
                />
            </div>

            <Dialog
                open={showDetails}
                onClose={() => setShowDetails(false)}
                title="Opportunity Details"
                size="lg"
            >
                <OpportunityForm
                    key={opp.id}
                    submitLabel="Save"
                    initialValues={{
                        stageId: String(opp.stage.id),
                        value: String(opp.value),
                        name: opp.name ?? "",
                        expectedCloseDate: opp.expectedCloseDate ?? "",
                        customFieldValues: initCustomFieldState(oppFields, opp.customFields),
                    }}
                    onSubmit={(values: OpportunitySubmitValues) =>
                        updateMutation.mutate({ id: opp.id, input: values })
                    }
                    isPending={updateMutation.isPending}
                    error={updateMutation.isError
                        ? ((updateMutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "An error occurred")
                        : undefined}
                    onCancel={() => setShowDetails(false)}
                />
            </Dialog>
        </>
    );
}

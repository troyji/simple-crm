import { useQuery } from "@tanstack/react-query";
import type { CustomField, Opportunity } from "@/types";
import { fetchCustomFields } from "@/api/custom-fields";
import { QUERY_KEYS } from "@/api/query-keys";
import { Button } from "@/components/ui/button";

interface Props {
    opp: Opportunity;
    onEdit: () => void;
    onDelete: () => void;
    isDeleting: boolean;
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export function OpportunityCard({ opp, onEdit, onDelete, isDeleting }: Props) {
    const { data: allCustomFields = [] } = useQuery<CustomField[]>({
        queryKey: QUERY_KEYS.customFields,
        queryFn: fetchCustomFields,
    });
    const oppFields = allCustomFields.filter(f => f.entity === "opportunity");
    const filledFields = oppFields.filter(f => opp.customFields?.[f.name] != null && opp.customFields[f.name] !== "");

    return (
        <div className="flex justify-between items-center p-2 bg-white border rounded">
            <div>
                <span className="font-medium">{opp.name || "Unnamed"}</span>
                <span className="text-sm text-gray-600 ml-2">{opp.stage.name}</span>
                <span className="text-sm text-gray-600 ml-2">{formatCurrency(opp.value)}</span>
                <span className="text-sm text-gray-500 ml-2">
                    Expected: {formatCurrency(opp.value * opp.stage.conversionLikelihood)}
                </span>
                {opp.expectedCloseDate && (
                    <span className="text-sm text-gray-500 ml-2">
                        Closes: {opp.expectedCloseDate}
                    </span>
                )}
                {filledFields.map(f => (
                    <span key={f.name} className="text-sm text-gray-500 ml-2">
                        <span className="font-medium">{f.label}:</span> {opp.customFields![f.name]}
                    </span>
                ))}
            </div>
            <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={onEdit}>Edit</Button>
                <Button variant="destructive" size="sm" onClick={onDelete} disabled={isDeleting}>Delete</Button>
            </div>
        </div>
    );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Lead, CustomField, Opportunity } from "@/types";
import { updateLead } from "@/api/leads";
import { fetchCustomFields } from "@/api/custom-fields";
import { fetchOpportunities, createOpportunity, updateOpportunity, deleteOpportunity } from "@/api/opportunities";
import { QUERY_KEYS } from "@/api/query-keys";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { initCustomFieldState } from "@/components/custom-field-inputs";
import { LeadForm, type LeadSubmitValues } from "./lead-form";
import { OpportunityForm, type OpportunitySubmitValues } from "./opportunity-form";
import { OpportunityCard } from "./opportunity-card";

export function LeadRow({ lead, shade }: { lead: Lead; shade?: boolean }) {
    const rowBg = shade ? "bg-gray-50" : "";
    const queryClient = useQueryClient();
    const [showOpps, setShowOpps] = useState(false);
    const [showEditLeadDialog, setShowEditLeadDialog] = useState(false);
    const [showAddOppDialog, setShowAddOppDialog] = useState(false);
    const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);

    const { data: allCustomFields = [] } = useQuery<CustomField[]>({
        queryKey: QUERY_KEYS.customFields,
        queryFn: fetchCustomFields,
    });
    const leadFields = allCustomFields.filter(f => (f.entity ?? "lead") === "lead");
    const oppFields = allCustomFields.filter(f => f.entity === "opportunity");

    const { data: allOpportunities = [] } = useQuery<Opportunity[]>({
        queryKey: QUERY_KEYS.opportunities,
        queryFn: fetchOpportunities,
        enabled: showOpps,
    });
    const opportunities = allOpportunities.filter(opp => opp.lead.id === lead.id);

    const updateMutation = useMutation({
        mutationFn: updateLead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leads });
            setShowEditLeadDialog(false);
        },
    });

    const createOppMutation = useMutation({
        mutationFn: createOpportunity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.opportunities });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pipeline });
            setShowAddOppDialog(false);
        },
    });

    const updateOppMutation = useMutation({
        mutationFn: updateOpportunity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.opportunities });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pipeline });
            setEditingOpp(null);
        },
    });

    const deleteOppMutation = useMutation({
        mutationFn: deleteOpportunity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.opportunities });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pipeline });
        },
    });

    const filledLeadFields = leadFields.filter(
        f => lead.customFields?.[f.name] != null && lead.customFields[f.name] !== ""
    );

    return (
        <>
            <tr className={rowBg}>
                <td className="p-2">{lead.firstName}</td>
                <td className="p-2">{lead.lastName}</td>
                <td className="p-2">{lead.age}</td>
                <td className="p-2">{lead.phoneNumber}</td>
                <td className="p-2 text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => setShowOpps(v => !v)} className="mr-1">
                        {showOpps ? "Hide" : "Show"} Opps
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowEditLeadDialog(true)}>Edit</Button>
                </td>
            </tr>

            {filledLeadFields.length > 0 && (
                <tr className={rowBg}>
                    <td colSpan={4} className="px-2 pb-2 text-sm text-gray-500">
                        {filledLeadFields.map(f => (
                            <span key={f.name} className="mr-4">
                                <span className="font-medium">{f.label}:</span> {lead.customFields![f.name]}
                            </span>
                        ))}
                    </td>
                    <td />
                </tr>
            )}

            {showOpps && (
                <tr>
                    <td colSpan={5} className="p-4 bg-white border-t">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold">Opportunities</h3>
                                <Button size="sm" onClick={() => setShowAddOppDialog(true)}>+ Add Opportunity</Button>
                            </div>
                            {opportunities.length === 0 ? (
                                <p className="text-gray-500 text-sm">No opportunities yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {opportunities.map(opp => (
                                        <OpportunityCard
                                            key={opp.id}
                                            opp={opp}
                                            onEdit={() => setEditingOpp(opp)}
                                            onDelete={() => deleteOppMutation.mutate(opp.id)}
                                            isDeleting={deleteOppMutation.isPending}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </td>
                </tr>
            )}

            <Dialog
                open={showEditLeadDialog}
                onClose={() => setShowEditLeadDialog(false)}
                title="Edit Lead"
            >
                <LeadForm
                    submitLabel="Update Lead"
                    initialValues={{
                        firstName: lead.firstName,
                        lastName: lead.lastName,
                        age: String(lead.age),
                        phoneNumber: lead.phoneNumber,
                        customFieldValues: initCustomFieldState(leadFields, lead.customFields),
                    }}
                    onSubmit={(values: LeadSubmitValues) => updateMutation.mutate({ id: lead.id, input: values })}
                    isPending={updateMutation.isPending}
                    error={updateMutation.isError
                        ? ((updateMutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "An error occurred")
                        : undefined}
                    onCancel={() => setShowEditLeadDialog(false)}
                />
            </Dialog>

            <Dialog
                open={showAddOppDialog}
                onClose={() => setShowAddOppDialog(false)}
                title="Add Opportunity"
            >
                <OpportunityForm
                    submitLabel="Add"
                    onSubmit={(values: OpportunitySubmitValues) =>
                        createOppMutation.mutate({ leadId: lead.id, ...values })
                    }
                    isPending={createOppMutation.isPending}
                    error={createOppMutation.isError
                        ? ((createOppMutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "An error occurred")
                        : undefined}
                    onCancel={() => setShowAddOppDialog(false)}
                />
            </Dialog>

            <Dialog
                open={editingOpp !== null}
                onClose={() => setEditingOpp(null)}
                title="Edit Opportunity"
            >
                {editingOpp && (
                    <OpportunityForm
                        key={editingOpp.id}
                        submitLabel="Save"
                        initialValues={{
                            stageId: String(editingOpp.stage.id),
                            value: String(editingOpp.value),
                            name: editingOpp.name ?? "",
                            customFieldValues: initCustomFieldState(oppFields, editingOpp.customFields),
                        }}
                        onSubmit={(values: OpportunitySubmitValues) =>
                            updateOppMutation.mutate({ id: editingOpp.id, input: values })
                        }
                        isPending={updateOppMutation.isPending}
                        error={updateOppMutation.isError
                            ? ((updateOppMutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "An error occurred")
                            : undefined}
                        onCancel={() => setEditingOpp(null)}
                    />
                )}
            </Dialog>
        </>
    );
}

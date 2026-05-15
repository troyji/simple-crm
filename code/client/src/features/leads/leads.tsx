import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Lead, CustomField } from "@/types";
import { LeadRow } from "./lead-row";
import { LeadForm, type LeadSubmitValues } from "./lead-form";
import { fetchLeads, createLead } from "@/api/leads";
import { fetchCustomFields } from "@/api/custom-fields";
import { QUERY_KEYS } from "@/api/query-keys";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export function Leads() {
    const queryClient = useQueryClient();
    const [showAddDialog, setShowAddDialog] = useState(false);

    const { data: leads = [] } = useQuery<Lead[]>({ queryKey: QUERY_KEYS.leads, queryFn: fetchLeads });
    const { data: allCustomFields = [] } = useQuery<CustomField[]>({
        queryKey: QUERY_KEYS.customFields,
        queryFn: fetchCustomFields,
    });
    const leadFields = allCustomFields.filter(f => (f.entity ?? "lead") === "lead");

    const createMutation = useMutation({
        mutationFn: createLead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leads });
            setShowAddDialog(false);
        },
    });

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Leads</h2>
                <Button onClick={() => setShowAddDialog(true)}>+ Add Lead</Button>
            </div>
            <table className="table-auto w-full">
                <thead>
                    <tr>
                        <th className="text-left p-2">First Name</th>
                        <th className="text-left p-2">Last Name</th>
                        <th className="text-left p-2">Age</th>
                        <th className="text-left p-2">Phone Number</th>
                        {leadFields.map(f => (
                            <th key={f.name} className="text-left p-2">{f.label}</th>
                        ))}
                        <th />
                    </tr>
                </thead>
                <tbody>
                    {leads.map((lead, i) => (
                        <LeadRow lead={lead} key={lead.id} shade={i % 2 === 1} leadFields={leadFields} />
                    ))}
                </tbody>
            </table>
            <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} title="Add Lead">
                <LeadForm
                    submitLabel="Add Lead"
                    onSubmit={(values: LeadSubmitValues) => createMutation.mutate(values)}
                    isPending={createMutation.isPending}
                    error={createMutation.isError
                        ? ((createMutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "An error occurred")
                        : undefined}
                    onCancel={() => setShowAddDialog(false)}
                />
            </Dialog>
        </div>
    );
}

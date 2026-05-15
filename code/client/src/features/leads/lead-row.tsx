import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Lead, CustomField, Opportunity } from "@/types";
import { updateLead } from "@/api/leads";
import { fetchCustomFields } from "@/api/custom-fields";
import { fetchOpportunities, deleteOpportunity } from "@/api/opportunities";
import { QUERY_KEYS } from "@/api/query-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LeadRow({ lead }: { lead: Lead }) {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [showOpps, setShowOpps] = useState(false);
    const [firstName, setFirstName] = useState(lead.firstName);
    const [lastName, setLastName] = useState(lead.lastName);
    const [age, setAge] = useState(`${lead.age}`);
    const [phoneNumber, setPhoneNumber] = useState(lead.phoneNumber);
    const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>(lead.customFields || {});

    const { data: customFields = [] } = useQuery<CustomField[]>({
        queryKey: QUERY_KEYS.customFields,
        queryFn: fetchCustomFields,
        enabled: isEditing,
    });

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
            setIsEditing(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteOpportunity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.opportunities });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pipeline });
        },
    });

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

    if (isEditing) {
        return (
            <tr>
                <td colSpan={6}>
                    <form
                        onSubmit={e => {
                            e.preventDefault();
                            updateMutation.mutate({ id: lead.id, input: { firstName, lastName, age, phoneNumber, customFields: customFieldValues } });
                        }}
                        className="space-y-4 p-4 rounded bg-gray-100 w-96"
                    >
                        <h2 className="text-xl font-bold">Edit</h2>
                        {updateMutation.isError && (
                            <p className="text-sm text-red-500">
                                {(updateMutation.error as { response?: { data?: string } })?.response?.data ?? "An error occurred"}
                            </p>
                        )}
                        {updateMutation.isSuccess && <p className="text-sm text-green-500">Lead updated successfully</p>}
                        <Input placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} />
                        <Input placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} />
                        <Input placeholder="Age" value={age} onChange={e => setAge(e.target.value)} />
                        <Input placeholder="Phone Number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                        {customFields.map(field => (
                            <Input
                                key={field.id}
                                placeholder={field.label}
                                value={customFieldValues[field.name] || ""}
                                onChange={e => setCustomFieldValues({ ...customFieldValues, [field.name]: e.target.value })}
                            />
                        ))}
                        <Button type="submit" disabled={updateMutation.isPending} className="w-full">
                            Update Lead
                        </Button>
                    </form>
                </td>
            </tr>
        );
    }

    return (
        <>
            <tr>
                <td>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="mr-2">
                        Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowOpps(!showOpps)}>
                        {showOpps ? "Hide" : "Show"} Opps
                    </Button>
                </td>
                <td>{firstName}</td>
                <td>{lastName}</td>
                <td>{age}</td>
                <td>{phoneNumber}</td>
            </tr>
            {showOpps && (
                <tr>
                    <td colSpan={5} className="p-4 bg-gray-50">
                        <div className="space-y-4">
                            <h3 className="font-bold">Opportunities</h3>
                            {opportunities.length === 0 ? (
                                <p className="text-gray-500">No opportunities</p>
                            ) : (
                                <div className="space-y-2">
                                    {opportunities.map(opp => (
                                        <div key={opp.id} className="flex justify-between items-center p-2 bg-white border rounded">
                                            <div>
                                                <span className="font-medium">{opp.name || "Unnamed"}</span>
                                                <span className="text-sm text-gray-600 ml-2">{opp.stage.name}</span>
                                                <span className="text-sm text-gray-600 ml-2">{formatCurrency(opp.value)}</span>
                                                <span className="text-sm text-gray-500 ml-2">
                                                    Expected: {formatCurrency(opp.value * opp.stage.conversionLikelihood)}
                                                </span>
                                            </div>
                                            <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(opp.id)}>
                                                Delete
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

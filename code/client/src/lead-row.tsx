import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Lead, CustomField, Opportunity } from "./types";
import { updateLead } from "./api/leads";
import { fetchCustomFields } from "./api/custom-fields";
import { fetchOpportunities, deleteOpportunity } from "./api/opportunities";
import { QUERY_KEYS } from "./api/query-keys";

export const LeadRow: React.FC<{ lead: Lead }> = ({ lead }) => {
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
        onError: () => {
            // keep form open on error
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
                            <p className="text-red-500">
                                {(updateMutation.error as { response?: { data?: string } })?.response?.data ?? "An error occurred"}
                            </p>
                        )}
                        {updateMutation.isSuccess && <p className="text-green-500">Lead updated successfully</p>}
                        <input
                            type="text"
                            placeholder="First Name"
                            value={firstName}
                            onChange={e => setFirstName(e.target.value)}
                            className="block w-full p-2 border border-gray-300 rounded"
                        />
                        <input
                            type="text"
                            placeholder="Last Name"
                            value={lastName}
                            onChange={e => setLastName(e.target.value)}
                            className="block w-full p-2 border border-gray-300 rounded"
                        />
                        <input
                            type="text"
                            placeholder="Age"
                            value={age}
                            onChange={e => setAge(e.target.value)}
                            className="block w-full p-2 border border-gray-300 rounded"
                        />
                        <input
                            type="text"
                            placeholder="Phone Number"
                            value={phoneNumber}
                            onChange={e => setPhoneNumber(e.target.value)}
                            className="block w-full p-2 border border-gray-300 rounded"
                        />
                        {customFields.map(field => (
                            <input
                                key={field.id}
                                type="text"
                                placeholder={field.label}
                                value={customFieldValues[field.name] || ""}
                                onChange={e =>
                                    setCustomFieldValues({
                                        ...customFieldValues,
                                        [field.name]: e.target.value,
                                    })
                                }
                                className="block w-full p-2 border border-gray-300 rounded"
                            />
                        ))}
                        <button type="submit" disabled={updateMutation.isPending} className="block w-full p-2 bg-blue-500 text-white rounded">
                            Update Lead
                        </button>
                    </form>
                </td>
            </tr>
        );
    }

    return (
        <>
            <tr>
                <td>
                    <button onClick={() => setIsEditing(true)} className="mr-2">
                        Edit
                    </button>
                    <button onClick={() => setShowOpps(!showOpps)}>{showOpps ? "Hide" : "Show"} Opps</button>
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
                                            <button
                                                onClick={() => deleteMutation.mutate(opp.id)}
                                                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                                            >
                                                Delete
                                            </button>
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
};

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CustomField } from "./types";
import { fetchCustomFields, createCustomField, deleteCustomField } from "./api/custom-fields";
import { QUERY_KEYS } from "./api/query-keys";

export const ManageFields: React.FC = () => {
    const queryClient = useQueryClient();
    const [newFieldName, setNewFieldName] = useState("");
    const [newFieldLabel, setNewFieldLabel] = useState("");
    const [newFieldEntity, setNewFieldEntity] = useState("lead");
    const [newFieldType, setNewFieldType] = useState("text");

    const { data: fields = [] } = useQuery<CustomField[]>({
        queryKey: QUERY_KEYS.customFields,
        queryFn: fetchCustomFields,
    });

    const addMutation = useMutation({
        mutationFn: createCustomField,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customFields });
            setNewFieldName("");
            setNewFieldLabel("");
            setNewFieldEntity("lead");
            setNewFieldType("text");
        },
        onError: () => {
            alert("Failed to add field. Field name might already exist.");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCustomField,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customFields });
        },
    });

    return (
        <div className="border-t pt-8">
            <h2 className="text-xl font-bold mb-4">Manage Custom Fields</h2>
            <div className="mb-6">
                <h3 className="font-bold mb-2">Existing Fields</h3>
                {fields.length === 0 ? (
                    <p className="text-gray-500">No custom fields yet</p>
                ) : (
                    <ul className="space-y-2">
                        {fields.map(field => (
                            <li key={field.id} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                                <div>
                                    <span className="font-medium">{field.label}</span>
                                    <span className="text-gray-500 text-sm ml-2">({field.name})</span>
                                    <span className="text-gray-400 text-xs ml-2">[{field.entity || "lead"} · {field.type || "text"}]</span>
                                </div>
                                <button
                                    onClick={() => deleteMutation.mutate(field.id)}
                                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <form
                onSubmit={e => {
                    e.preventDefault();
                    if (!newFieldName || !newFieldLabel) return;
                    addMutation.mutate({ name: newFieldName, label: newFieldLabel, entity: newFieldEntity, type: newFieldType });
                }}
                className="space-y-3"
            >
                <h3 className="font-bold">Add New Field</h3>
                <div>
                    <label className="block text-sm font-medium mb-1">Field Name (e.g., company)</label>
                    <input
                        type="text"
                        value={newFieldName}
                        onChange={e => setNewFieldName(e.target.value)}
                        placeholder="company"
                        className="border rounded px-2 py-1 w-full"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Field Label (e.g., Company)</label>
                    <input
                        type="text"
                        value={newFieldLabel}
                        onChange={e => setNewFieldLabel(e.target.value)}
                        placeholder="Company"
                        className="border rounded px-2 py-1 w-full"
                    />
                </div>
                <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Applies to</label>
                        <select
                            value={newFieldEntity}
                            onChange={e => setNewFieldEntity(e.target.value)}
                            className="border rounded px-2 py-1 w-full"
                        >
                            <option value="lead">Lead</option>
                            <option value="opportunity">Opportunity</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Type</label>
                        <select
                            value={newFieldType}
                            onChange={e => setNewFieldType(e.target.value)}
                            className="border rounded px-2 py-1 w-full"
                        >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                        </select>
                    </div>
                </div>
                <button type="submit" disabled={addMutation.isPending} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    Add Field
                </button>
            </form>
        </div>
    );
};

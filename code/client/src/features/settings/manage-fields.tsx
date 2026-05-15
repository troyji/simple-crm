import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CustomField } from "@/types";
import { fetchCustomFields, createCustomField, deleteCustomField } from "@/api/custom-fields";
import { QUERY_KEYS } from "@/api/query-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function ManageFields() {
    const queryClient = useQueryClient();
    const [newFieldName, setNewFieldName] = useState("");
    const [newFieldLabel, setNewFieldLabel] = useState("");
    const [newFieldEntity, setNewFieldEntity] = useState("lead");
    const [newFieldType, setNewFieldType] = useState("text");
    const [addError, setAddError] = useState<string | null>(null);
    const [confirmDeleteField, setConfirmDeleteField] = useState<CustomField | null>(null);

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
            setAddError(null);
        },
        onError: () => setAddError("Failed to add field. Field name might already exist."),
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
                                    <span className="text-gray-400 text-xs ml-2">
                                        [{field.entity || "lead"} · {field.type || "text"}]
                                    </span>
                                </div>
                                <Button variant="destructive" size="sm" onClick={() => setConfirmDeleteField(field)}>
                                    Delete
                                </Button>
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
                {addError && <p className="text-sm text-red-500">{addError}</p>}
                <div>
                    <Label htmlFor="field-name">Field Name (e.g., company)</Label>
                    <Input
                        id="field-name"
                        value={newFieldName}
                        onChange={e => setNewFieldName(e.target.value)}
                        placeholder="company"
                    />
                </div>
                <div>
                    <Label htmlFor="field-label">Field Label (e.g., Company)</Label>
                    <Input
                        id="field-label"
                        value={newFieldLabel}
                        onChange={e => setNewFieldLabel(e.target.value)}
                        placeholder="Company"
                    />
                </div>
                <div className="flex gap-2">
                    <div className="flex-1">
                        <Label htmlFor="field-entity">Applies to</Label>
                        <Select id="field-entity" value={newFieldEntity} onChange={e => setNewFieldEntity(e.target.value)}>
                            <option value="lead">Lead</option>
                            <option value="opportunity">Opportunity</option>
                        </Select>
                    </div>
                    <div className="flex-1">
                        <Label htmlFor="field-type">Type</Label>
                        <Select id="field-type" value={newFieldType} onChange={e => setNewFieldType(e.target.value)}>
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                        </Select>
                    </div>
                </div>
                <Button type="submit" disabled={addMutation.isPending}>
                    Add Field
                </Button>
            </form>
            <ConfirmDialog
                open={confirmDeleteField !== null}
                title="Delete Custom Field"
                message={`Delete "${confirmDeleteField?.label}"? This cannot be undone.`}
                confirmLabel="Delete"
                onConfirm={() => {
                    if (confirmDeleteField) deleteMutation.mutate(confirmDeleteField.id);
                    setConfirmDeleteField(null);
                }}
                onCancel={() => setConfirmDeleteField(null)}
            />
        </div>
    );
}

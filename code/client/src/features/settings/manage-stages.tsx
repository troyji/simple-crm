import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Stage } from "@/types";
import { fetchStages, createStage, updateStage, deleteStage } from "@/api/stages";
import { QUERY_KEYS } from "@/api/query-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function ManageStages() {
    const queryClient = useQueryClient();
    const [newName, setNewName] = useState("");
    const [newStatus, setNewStatus] = useState<"pending" | "won" | "lost">("pending");
    const [newLikelihood, setNewLikelihood] = useState("0.5");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [editStatus, setEditStatus] = useState<"pending" | "won" | "lost">("pending");
    const [editLikelihood, setEditLikelihood] = useState("0.5");
    const [addError, setAddError] = useState<string | null>(null);
    const [editError, setEditError] = useState<string | null>(null);

    const { data: stages = [] } = useQuery<Stage[]>({
        queryKey: QUERY_KEYS.stages,
        queryFn: fetchStages,
    });

    const addMutation = useMutation({
        mutationFn: createStage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stages });
            setNewName("");
            setNewStatus("pending");
            setNewLikelihood("0.5");
            setAddError(null);
        },
        onError: () => setAddError("Failed to add stage"),
    });

    const editMutation = useMutation({
        mutationFn: updateStage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stages });
            setEditingId(null);
            setEditError(null);
        },
        onError: () => setEditError("Failed to update stage"),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteStage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stages });
        },
    });

    const startEdit = (stage: Stage) => {
        setEditingId(stage.id);
        setEditName(stage.name);
        setEditStatus(stage.status);
        setEditLikelihood(stage.conversionLikelihood.toString());
        setEditError(null);
    };

    return (
        <div className="border-t pt-8">
            <h2 className="text-xl font-bold mb-4">Manage Stages</h2>
            <div className="mb-6">
                <h3 className="font-bold mb-2">Existing Stages</h3>
                {stages.length === 0 ? (
                    <p className="text-gray-500">No stages</p>
                ) : (
                    <ul className="space-y-2">
                        {stages.map(stage => (
                            <li key={stage.id} className="p-3 bg-gray-100 rounded">
                                {editingId === stage.id ? (
                                    <div className="space-y-2">
                                        {editError && <p className="text-sm text-red-500">{editError}</p>}
                                        <Input value={editName} onChange={e => setEditName(e.target.value)} />
                                        <Select
                                            value={editStatus}
                                            onChange={e => setEditStatus(e.target.value as "pending" | "won" | "lost")}
                                        >
                                            <option value="pending">pending</option>
                                            <option value="won">won</option>
                                            <option value="lost">lost</option>
                                        </Select>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={editLikelihood}
                                            onChange={e => setEditLikelihood(e.target.value)}
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    editMutation.mutate({
                                                        id: editingId,
                                                        input: {
                                                            name: editName,
                                                            status: editStatus,
                                                            conversionLikelihood: parseFloat(editLikelihood),
                                                        },
                                                    })
                                                }
                                            >
                                                Save
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="font-medium">{stage.name}</span>
                                            <span className="text-xs text-gray-600 ml-2">({stage.status})</span>
                                            <span className="text-xs text-gray-600 ml-2">{(stage.conversionLikelihood * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => startEdit(stage)}>
                                                Edit
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => {
                                                    if (confirm("Delete this stage?")) deleteMutation.mutate(stage.id);
                                                }}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <form
                onSubmit={e => {
                    e.preventDefault();
                    if (!newName) return;
                    addMutation.mutate({ name: newName, status: newStatus, conversionLikelihood: parseFloat(newLikelihood) });
                }}
                className="space-y-3"
            >
                <h3 className="font-bold">Add New Stage</h3>
                {addError && <p className="text-sm text-red-500">{addError}</p>}
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Stage name" />
                <Select value={newStatus} onChange={e => setNewStatus(e.target.value as "pending" | "won" | "lost")}>
                    <option value="pending">Pending</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                </Select>
                <div>
                    <Label htmlFor="new-likelihood">Conversion Likelihood: {(parseFloat(newLikelihood) * 100).toFixed(0)}%</Label>
                    <input
                        id="new-likelihood"
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={newLikelihood}
                        onChange={e => setNewLikelihood(e.target.value)}
                        className="w-full"
                    />
                </div>
                <Button type="submit" disabled={addMutation.isPending} className="w-full">
                    Add Stage
                </Button>
            </form>
        </div>
    );
}

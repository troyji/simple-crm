import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Stage } from "./types";
import { fetchStages, createStage, updateStage, deleteStage } from "./api/stages";
import { QUERY_KEYS } from "./api/query-keys";

export const ManageStages: React.FC = () => {
    const queryClient = useQueryClient();
    const [newName, setNewName] = useState("");
    const [newStatus, setNewStatus] = useState<"pending" | "won" | "lost">("pending");
    const [newLikelihood, setNewLikelihood] = useState("0.5");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [editStatus, setEditStatus] = useState<"pending" | "won" | "lost">("pending");
    const [editLikelihood, setEditLikelihood] = useState("0.5");

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
        },
        onError: () => alert("Failed to add stage"),
    });

    const editMutation = useMutation({
        mutationFn: updateStage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stages });
            setEditingId(null);
        },
        onError: () => alert("Failed to update stage"),
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
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            className="block w-full p-2 border rounded"
                                        />
                                        <select
                                            value={editStatus}
                                            onChange={e => setEditStatus(e.target.value as "pending" | "won" | "lost")}
                                            className="block w-full p-2 border rounded"
                                        >
                                            <option value="pending">pending</option>
                                            <option value="won">won</option>
                                            <option value="lost">lost</option>
                                        </select>
                                        <input
                                            type="number"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={editLikelihood}
                                            onChange={e => setEditLikelihood(e.target.value)}
                                            className="block w-full p-2 border rounded"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => editMutation.mutate({ id: editingId, input: { name: editName, status: editStatus, conversionLikelihood: parseFloat(editLikelihood) } })}
                                                className="bg-green-500 text-white px-3 py-1 rounded"
                                            >
                                                Save
                                            </button>
                                            <button onClick={() => setEditingId(null)} className="bg-gray-500 text-white px-3 py-1 rounded">
                                                Cancel
                                            </button>
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
                                            <button onClick={() => startEdit(stage)} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm">
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => { if (confirm("Delete this stage?")) deleteMutation.mutate(stage.id); }}
                                                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                                            >
                                                Delete
                                            </button>
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
                <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Stage name"
                    className="block w-full p-2 border rounded"
                />
                <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as "pending" | "won" | "lost")}
                    className="block w-full p-2 border rounded"
                >
                    <option value="pending">Pending</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                </select>
                <div>
                    <label className="text-sm block mb-1">Conversion Likelihood: {(parseFloat(newLikelihood) * 100).toFixed(0)}%</label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={newLikelihood}
                        onChange={e => setNewLikelihood(e.target.value)}
                        className="w-full"
                    />
                </div>
                <button type="submit" disabled={addMutation.isPending} className="block w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Add Stage
                </button>
            </form>
        </div>
    );
};

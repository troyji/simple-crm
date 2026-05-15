import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppSetting } from "./types";
import { fetchSettings, saveSetting } from "./api/settings";
import { QUERY_KEYS } from "./api/query-keys";

export const ManageSettings: React.FC = () => {
    const queryClient = useQueryClient();
    const [edits, setEdits] = useState<Record<string, string>>({});

    const { data: settings = [] } = useQuery<AppSetting[]>({
        queryKey: QUERY_KEYS.settings,
        queryFn: fetchSettings,
    });

    const saveMutation = useMutation({
        mutationFn: saveSetting,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stages });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pipeline });
        },
    });

    const handleSave = (key: string) => {
        const value = edits[key];
        if (value === undefined) return;
        saveMutation.mutate({ key, value });
        setEdits(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    return (
        <div className="border-t pt-8">
            <h2 className="text-xl font-bold mb-4">App Settings</h2>
            {settings.length === 0 ? (
                <p className="text-gray-500">No settings</p>
            ) : (
                <ul className="space-y-2">
                    {settings.map(s => {
                        const draft = edits[s.key] ?? s.value;
                        const dirty = edits[s.key] !== undefined && edits[s.key] !== s.value;
                        return (
                            <li key={s.key} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                                <div className="font-mono text-sm">{s.key}</div>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={draft}
                                        onChange={e => setEdits(prev => ({ ...prev, [s.key]: e.target.value }))}
                                        className="border rounded px-2 py-1 font-mono text-sm w-32"
                                    />
                                    <button
                                        onClick={() => handleSave(s.key)}
                                        disabled={!dirty || saveMutation.isPending}
                                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:bg-gray-300 text-sm"
                                    >
                                        Save
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

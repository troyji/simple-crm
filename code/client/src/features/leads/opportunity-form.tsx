import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CustomField, Stage } from "@/types";
import { fetchCustomFields } from "@/api/custom-fields";
import { fetchStages } from "@/api/stages";
import { QUERY_KEYS } from "@/api/query-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CustomFieldInputs, coerceCustomFields } from "@/components/custom-field-inputs";

export interface OpportunitySubmitValues {
    stageId: number;
    value: number;
    name?: string;
    expectedCloseDate?: string | null;
    customFields: Record<string, string | number>;
}

interface Props {
    submitLabel: string;
    initialValues?: {
        stageId: string;
        value: string;
        name: string;
        expectedCloseDate: string;
        customFieldValues: Record<string, string>;
    };
    onSubmit: (values: OpportunitySubmitValues) => void;
    isPending: boolean;
    error?: string;
    onCancel: () => void;
}

export function OpportunityForm({ submitLabel, initialValues, onSubmit, isPending, error, onCancel }: Props) {
    const [stageId, setStageId] = useState(initialValues?.stageId ?? "");
    const [value, setValue] = useState(initialValues?.value ?? "");
    const [name, setName] = useState(initialValues?.name ?? "");
    const [expectedCloseDate, setExpectedCloseDate] = useState(initialValues?.expectedCloseDate ?? "");
    const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>(
        initialValues?.customFieldValues ?? {}
    );

    const { data: stages = [] } = useQuery<Stage[]>({
        queryKey: QUERY_KEYS.stages,
        queryFn: fetchStages,
    });

    const { data: allCustomFields = [] } = useQuery<CustomField[]>({
        queryKey: QUERY_KEYS.customFields,
        queryFn: fetchCustomFields,
    });
    const oppFields = allCustomFields.filter(f => f.entity === "opportunity");

    return (
        <form
            onSubmit={e => {
                e.preventDefault();
                onSubmit({
                    stageId: Number(stageId),
                    value: Number(value),
                    name: name || undefined,
                    expectedCloseDate: expectedCloseDate || null,
                    customFields: coerceCustomFields(oppFields, customFieldValues),
                });
            }}
            className="space-y-3"
        >
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div>
                <Label>Stage</Label>
                <Select value={stageId} onChange={e => setStageId(e.target.value)}>
                    <option value="">Select stage…</option>
                    {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
            </div>
            <div>
                <Label>Value</Label>
                <Input type="number" value={value} onChange={e => setValue(e.target.value)} />
            </div>
            <div>
                <Label>Name (optional)</Label>
                <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
                <Label>Expected Close Date (optional)</Label>
                <Input type="date" value={expectedCloseDate} onChange={e => setExpectedCloseDate(e.target.value)} />
            </div>
            <CustomFieldInputs fields={oppFields} values={customFieldValues} onChange={setCustomFieldValues} />
            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isPending}>{submitLabel}</Button>
            </div>
        </form>
    );
}

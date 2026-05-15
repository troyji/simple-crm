import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CustomField } from "@/types";
import { fetchCustomFields } from "@/api/custom-fields";
import { QUERY_KEYS } from "@/api/query-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomFieldInputs, coerceCustomFields } from "@/components/custom-field-inputs";

export interface LeadSubmitValues {
    firstName: string;
    lastName: string;
    age: string;
    phoneNumber: string;
    customFields: Record<string, string | number>;
}

interface Props {
    submitLabel: string;
    initialValues?: {
        firstName: string;
        lastName: string;
        age: string;
        phoneNumber: string;
        customFieldValues: Record<string, string>;
    };
    onSubmit: (values: LeadSubmitValues) => void;
    isPending: boolean;
    error?: string;
    onCancel?: () => void;
}

export function LeadForm({ submitLabel, initialValues, onSubmit, isPending, error, onCancel }: Props) {
    const [firstName, setFirstName] = useState(initialValues?.firstName ?? "");
    const [lastName, setLastName] = useState(initialValues?.lastName ?? "");
    const [age, setAge] = useState(initialValues?.age ?? "");
    const [phoneNumber, setPhoneNumber] = useState(initialValues?.phoneNumber ?? "");
    const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>(
        initialValues?.customFieldValues ?? {}
    );

    const { data: allCustomFields = [] } = useQuery<CustomField[]>({
        queryKey: QUERY_KEYS.customFields,
        queryFn: fetchCustomFields,
    });
    const leadFields = allCustomFields.filter(f => (f.entity ?? "lead") === "lead");

    return (
        <form
            onSubmit={e => {
                e.preventDefault();
                onSubmit({ firstName, lastName, age, phoneNumber, customFields: coerceCustomFields(leadFields, customFieldValues) });
            }}
            className="space-y-3"
        >
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div>
                <Label>First Name</Label>
                <Input value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div>
                <Label>Last Name</Label>
                <Input value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
            <div>
                <Label>Age</Label>
                <Input value={age} onChange={e => setAge(e.target.value)} />
            </div>
            <div>
                <Label>Phone Number</Label>
                <Input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
            </div>
            <CustomFieldInputs fields={leadFields} values={customFieldValues} onChange={setCustomFieldValues} />
            <div className="flex justify-end gap-2 pt-2">
                {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
                <Button type="submit" disabled={isPending}>{submitLabel}</Button>
            </div>
        </form>
    );
}

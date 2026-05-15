import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CustomField } from "@/types";
import { createLead } from "@/api/leads";
import { fetchCustomFields } from "@/api/custom-fields";
import { QUERY_KEYS } from "@/api/query-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddLead() {
    const queryClient = useQueryClient();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [age, setAge] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

    const { data: customFields = [] } = useQuery<CustomField[]>({
        queryKey: QUERY_KEYS.customFields,
        queryFn: fetchCustomFields,
    });

    const mutation = useMutation({
        mutationFn: createLead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leads });
            setFirstName("");
            setLastName("");
            setAge("");
            setPhoneNumber("");
            setCustomFieldValues({});
            setTimeout(() => mutation.reset(), 3000);
        },
    });

    return (
        <form
            onSubmit={e => {
                e.preventDefault();
                mutation.mutate({ firstName, lastName, age, phoneNumber, customFields: customFieldValues });
            }}
            className="space-y-4 p-4 rounded bg-gray-100 w-96"
        >
            <h2 className="text-xl font-bold">Add Lead</h2>
            {mutation.isError && (
                <p className="text-sm text-red-500">
                    {(mutation.error as { response?: { data?: string } })?.response?.data ?? "An error occurred"}
                </p>
            )}
            {mutation.isSuccess && <p className="text-sm text-green-500">Lead added successfully</p>}
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
            <Button type="submit" disabled={mutation.isPending} className="w-full">
                Add Lead
            </Button>
        </form>
    );
}

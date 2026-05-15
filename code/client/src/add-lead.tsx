import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CustomField } from "./types";
import { createLead } from "./api/leads";
import { fetchCustomFields } from "./api/custom-fields";
import { QUERY_KEYS } from "./api/query-keys";

export const AddLead: React.FC = () => {
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
                <p className="text-red-500">{(mutation.error as { response?: { data?: string } })?.response?.data ?? "An error occurred"}</p>
            )}
            {mutation.isSuccess && <p className="text-green-500">Lead added successfully</p>}
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
            <button type="submit" disabled={mutation.isPending} className="block w-full p-2 bg-blue-500 text-white rounded">
                Add Lead
            </button>
        </form>
    );
};

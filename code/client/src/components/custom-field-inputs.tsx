import type { CustomField } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
    fields: CustomField[];
    values: Record<string, string>;
    onChange: (values: Record<string, string>) => void;
}

export function CustomFieldInputs({ fields, values, onChange }: Props) {
    return (
        <>
            {fields.map(field => (
                <div key={field.id}>
                    <Label>{field.label}</Label>
                    <Input
                        type={field.type === "number" ? "number" : "text"}
                        value={values[field.name] ?? ""}
                        onChange={e => onChange({ ...values, [field.name]: e.target.value })}
                    />
                </div>
            ))}
        </>
    );
}

export function coerceCustomFields(
    fields: CustomField[],
    values: Record<string, string>,
): Record<string, string | number> {
    return Object.fromEntries(
        fields.map(f => [
            f.name,
            f.type === "number" ? (parseFloat(values[f.name]) || 0) : (values[f.name] ?? ""),
        ]),
    );
}

export function initCustomFieldState(
    fields: CustomField[],
    stored: Record<string, string | number> | undefined,
): Record<string, string> {
    return Object.fromEntries(fields.map(f => [f.name, String(stored?.[f.name] ?? "")]));
}

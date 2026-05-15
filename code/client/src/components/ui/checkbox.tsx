import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
    id: string;
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export function Checkbox({ id, label, checked, onChange, className, ...props }: CheckboxProps) {
    return (
        <div className={cn("flex items-center gap-2 cursor-pointer", className)} {...props}>
            <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={e => onChange(e.target.checked)}
                className="w-4 h-4 accent-blue-500 cursor-pointer"
            />
            <label htmlFor={id} className="text-sm cursor-pointer select-none">
                {label}
            </label>
        </div>
    );
}

import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
    return (
        <select
            className={cn(
                "block w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "disabled:bg-gray-50 disabled:text-gray-500",
                className,
            )}
            {...props}
        >
            {children}
        </select>
    );
}

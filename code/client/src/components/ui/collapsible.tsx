import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CollapsibleProps {
    isOpen: boolean;
    onToggle: () => void;
    header: ReactNode;
    children: ReactNode;
    className?: string;
}

export function Collapsible({ isOpen, onToggle, header, children, className }: CollapsibleProps) {
    return (
        <div className={cn("border rounded", className)}>
            <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition"
                onClick={onToggle}
            >
                {header}
                <span className="text-gray-500 text-xs ml-2">{isOpen ? "▲" : "▼"}</span>
            </button>
            {isOpen && <div className="border-t">{children}</div>}
        </div>
    );
}

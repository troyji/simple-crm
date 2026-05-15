import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
    default: "bg-gray-50 border-gray-200",
    info: "bg-blue-50 border-blue-200",
    success: "bg-green-50 border-green-200",
    danger: "bg-red-50 border-red-200",
};

type CardProps = HTMLAttributes<HTMLDivElement> & {
    variant?: keyof typeof variants;
};

export function Card({ className, variant = "default", ...props }: CardProps) {
    return <div className={cn("p-4 rounded border", variants[variant], className)} {...props} />;
}

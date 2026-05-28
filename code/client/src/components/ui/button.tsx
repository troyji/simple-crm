import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
    default: "bg-blue-500 text-white hover:bg-blue-600",
    destructive: "bg-red-500 text-white hover:bg-red-600",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
    ghost: "text-gray-700 hover:bg-gray-100",
};

const sizes = {
    default: "px-4 py-2 text-sm",
    sm: "px-3 py-1 text-sm",
    lg: "px-6 py-3 text-base",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: keyof typeof variants;
    size?: keyof typeof sizes;
};

export function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
    return (
        <button
            className={cn(
                "inline-flex items-center justify-center rounded font-medium transition cursor-pointer",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                variants[variant],
                sizes[size],
                className,
            )}
            {...props}
        />
    );
}

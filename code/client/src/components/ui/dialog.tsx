import { type ReactNode } from "react";
import { createPortal } from "react-dom";

interface Props {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

export function Dialog({ open, onClose, title, children }: Props) {
    if (!open) return null;
    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>
                <div className="px-6 py-4 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>,
        document.body,
    );
}

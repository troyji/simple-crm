import { useEffect, useRef } from "react";
import type { Stage } from "@/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface StageFilterProps {
    stages: Stage[];
    pendingFilter: Set<number>;
    filterOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    onTogglePending: (stageId: number) => void;
    onApply: () => void;
}

export function StageFilter({ stages, pendingFilter, filterOpen, onOpen, onClose, onTogglePending, onApply }: StageFilterProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!filterOpen) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [filterOpen, onClose]);

    const sorted = [...stages].sort((a, b) => a.order - b.order);
    const groups: { status: "pending" | "won" | "lost"; label: string }[] = [
        { status: "pending", label: "Pending" },
        { status: "won", label: "Won" },
        { status: "lost", label: "Lost" },
    ];

    return (
        <div className="relative" ref={containerRef}>
            <Button variant="outline" size="sm" onClick={onOpen}>
                Filter Stages ▾
            </Button>
            {filterOpen && (
                <div className="absolute top-full right-0 mt-1 z-20 bg-white border rounded shadow-lg p-3 min-w-[200px]">
                    <div className="space-y-3 mb-3">
                        {groups.map(({ status, label }) => {
                            const group = sorted.filter(s => s.status === status);
                            if (group.length === 0) return null;
                            return (
                                <div key={status}>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                                    <div className="space-y-1">
                                        {group.map(stage => (
                                            <Checkbox
                                                key={stage.id}
                                                id={`stage-${stage.id}`}
                                                label={stage.name}
                                                checked={pendingFilter.has(stage.id)}
                                                onChange={() => onTogglePending(stage.id)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <Button variant="default" size="sm" className="w-full" onClick={onApply}>
                        Apply
                    </Button>
                </div>
            )}
        </div>
    );
}

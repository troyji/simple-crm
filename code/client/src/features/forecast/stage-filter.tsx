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

    return (
        <div className="relative" ref={containerRef}>
            <Button variant="outline" size="sm" onClick={onOpen}>
                Filter Stages ▾
            </Button>
            {filterOpen && (
                <div className="absolute top-full right-0 mt-1 z-20 bg-white border rounded shadow-lg p-3 min-w-[200px]">
                    <div className="space-y-2 mb-3">
                        {sorted.map(stage => (
                            <Checkbox
                                key={stage.id}
                                id={`stage-${stage.id}`}
                                label={stage.name}
                                checked={pendingFilter.has(stage.id)}
                                onChange={() => onTogglePending(stage.id)}
                            />
                        ))}
                    </div>
                    <Button variant="default" size="sm" className="w-full" onClick={onApply}>
                        Apply
                    </Button>
                </div>
            )}
        </div>
    );
}

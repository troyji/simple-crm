import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    pointerWithin,
    rectIntersection,
    useSensor,
    useSensors,
    type CollisionDetection,
    type DragEndEvent,
    type DragOverEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import type { Opportunity, PipelineReport, Stage } from "@/types";
import { fetchStages } from "@/api/stages";
import { fetchOpportunities } from "@/api/opportunities";
import { fetchPipeline, movePipelineOpportunity } from "@/api/pipeline";
import { QUERY_KEYS } from "@/api/query-keys";
import { Button } from "@/components/ui/button";
import { StageColumn } from "./stage-column";
import { TilePresentation } from "./opportunity-tile";

const COLUMN_WIDTH_PX = 288; // w-72
const COLUMN_GAP_PX = 16;    // gap-4
const SCROLL_STEP_PX = COLUMN_WIDTH_PX + COLUMN_GAP_PX;

// Check tile droppables before column droppables so that hovering inside a tile resolves
// to that tile (not the column it sits inside). Empty columns fall through to the column
// check, which keeps them as valid drop targets.
const collisionDetection: CollisionDetection = args => {
    const isColumn = (c: { data: { current?: { type?: string } } }) =>
        c.data.current?.type === "stage-dropzone";
    const tileContainers = args.droppableContainers.filter(c => !isColumn(c));
    const columnContainers = args.droppableContainers.filter(isColumn);

    const tilePointerHits = pointerWithin({ ...args, droppableContainers: tileContainers });
    if (tilePointerHits.length > 0) return tilePointerHits;

    const columnPointerHits = pointerWithin({ ...args, droppableContainers: columnContainers });
    if (columnPointerHits.length > 0) return columnPointerHits;

    const tileRectHits = rectIntersection({ ...args, droppableContainers: tileContainers });
    if (tileRectHits.length > 0) return tileRectHits;

    return rectIntersection({ ...args, droppableContainers: columnContainers });
};

interface DropTarget {
    toStageId: number;
    toIndex: number;
}

function resolveDropTarget(
    activeId: number,
    overId: number | string,
    overData: { stageId?: number; type?: string } | undefined,
    opportunities: Opportunity[],
    activeStageId: number,
): DropTarget | null {
    const overIsColumn = overData?.type === "stage-dropzone";
    const toStageId = overData?.stageId ?? activeStageId;

    const destFull = opportunities
        .filter(o => o.stage.id === toStageId)
        .sort((a, b) => a.position - b.position);
    const destOthersCount = destFull.filter(o => o.id !== activeId).length;

    let toIndex: number;
    if (overIsColumn) {
        toIndex = destOthersCount;
    } else {
        const numericOverId = Number(overId);
        const overIdxFull = destFull.findIndex(o => o.id === numericOverId);
        toIndex = overIdxFull === -1 ? destOthersCount : overIdxFull;
    }

    return { toStageId, toIndex };
}

function applyMoveToCache(
    opportunities: Opportunity[],
    stages: Stage[],
    activeOppId: number,
    toStageId: number,
    toIndex: number,
): Opportunity[] {
    const destStage = stages.find(s => s.id === toStageId);
    if (!destStage) return opportunities;
    const withStage = opportunities.map(o =>
        o.id === activeOppId ? { ...o, stage: destStage } : o,
    );
    const others = withStage
        .filter(o => o.stage.id === toStageId && o.id !== activeOppId)
        .sort((a, b) => a.position - b.position);
    const moved = withStage.find(o => o.id === activeOppId);
    if (!moved) return withStage;
    const reordered = [...others];
    reordered.splice(Math.min(toIndex, reordered.length), 0, moved);
    const positionMap = new Map(reordered.map((o, i) => [o.id, i + 1]));
    return withStage.map(o => positionMap.has(o.id) ? { ...o, position: positionMap.get(o.id)! } : o);
}

export function PipelineBoard() {
    const queryClient = useQueryClient();
    const dragStartSnapshotRef = useRef<Opportunity[] | undefined>(undefined);
    const viewportRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [scrollOffset, setScrollOffset] = useState(0);
    const [maxOffset, setMaxOffset] = useState(0);

    const { data: stages = [], isPending: stagesPending } = useQuery<Stage[]>({
        queryKey: QUERY_KEYS.stages,
        queryFn: fetchStages,
    });
    const { data: opportunities = [], isPending: oppsPending } = useQuery<Opportunity[]>({
        queryKey: QUERY_KEYS.opportunities,
        queryFn: fetchOpportunities,
    });
    const { data: report } = useQuery<PipelineReport>({
        queryKey: QUERY_KEYS.pipeline,
        queryFn: fetchPipeline,
    });

    const oppsByStage = useMemo(() => {
        const map = new Map<number, Opportunity[]>();
        for (const stage of stages) map.set(stage.id, []);
        for (const opp of opportunities) {
            const bucket = map.get(opp.stage.id);
            if (bucket) bucket.push(opp);
        }
        for (const list of map.values()) {
            list.sort((a, b) => a.position - b.position);
        }
        return map;
    }, [stages, opportunities]);

    const stageStats = useMemo(() => {
        const map = new Map<number, { totalValue: number; expectedValue: number }>();
        for (const stage of stages) map.set(stage.id, { totalValue: 0, expectedValue: 0 });
        for (const item of report?.byStage ?? []) {
            map.set(item.stage.id, { totalValue: item.totalValue, expectedValue: item.expectedValue });
        }
        return map;
    }, [report, stages]);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const moveMutation = useMutation({
        mutationFn: movePipelineOpportunity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.opportunities });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pipeline });
        },
    });

    const scrollColumns = (direction: -1 | 1) => {
        setScrollOffset(prev => Math.max(0, Math.min(maxOffset, prev + direction * SCROLL_STEP_PX)));
    };

    // Measure the actual rendered widths instead of computing from constants — protects
    // against any drift between assumed column/gap sizes and what Tailwind actually paints.
    useLayoutEffect(() => {
        const viewport = viewportRef.current;
        const track = trackRef.current;
        if (!viewport || !track) return;
        const update = () => {
            const visible = viewport.clientWidth;
            const total = track.scrollWidth;
            setMaxOffset(Math.max(0, total - visible));
        };
        update();
        const observer = new ResizeObserver(update);
        observer.observe(viewport);
        observer.observe(track);
        return () => observer.disconnect();
    }, [stages.length]);

    // Re-clamp the offset when the available width shrinks (e.g. window resize) so the
    // rightmost column doesn't get pushed past the right edge.
    useEffect(() => {
        setScrollOffset(prev => Math.min(prev, maxOffset));
    }, [maxOffset]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(Number(event.active.id));
        dragStartSnapshotRef.current = queryClient.getQueryData<Opportunity[]>(QUERY_KEYS.opportunities);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over || over.id === active.id) return;

        const activeOppId = Number(active.id);
        const current = queryClient.getQueryData<Opportunity[]>(QUERY_KEYS.opportunities);
        if (!current) return;
        const activeOpp = current.find(o => o.id === activeOppId);
        if (!activeOpp) return;

        const overData = over.data.current as { stageId?: number; type?: string } | undefined;
        const toStageId = overData?.stageId ?? activeOpp.stage.id;

        // Only mutate state when the active crosses a container boundary. Within-container
        // reordering is handled visually by SortableContext via transforms — touching state
        // here would re-measure droppable rects mid-drag and thrash the over-target.
        if (activeOpp.stage.id === toStageId) return;

        const target = resolveDropTarget(activeOppId, over.id, overData, current, activeOpp.stage.id);
        if (!target) return;

        queryClient.setQueryData<Opportunity[]>(QUERY_KEYS.opportunities, prev => {
            if (!prev) return prev;
            return applyMoveToCache(prev, stages, activeOppId, target.toStageId, target.toIndex);
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const snapshot = dragStartSnapshotRef.current;
        dragStartSnapshotRef.current = undefined;
        setActiveId(null);

        const { active, over } = event;
        const activeOppId = Number(active.id);

        if (!over) {
            if (snapshot) queryClient.setQueryData(QUERY_KEYS.opportunities, snapshot);
            return;
        }

        const current = queryClient.getQueryData<Opportunity[]>(QUERY_KEYS.opportunities);
        if (!current) return;
        const activeOpp = current.find(o => o.id === activeOppId);
        if (!activeOpp) return;

        const overData = over.data.current as { stageId?: number; type?: string } | undefined;
        const target = resolveDropTarget(activeOppId, over.id, overData, current, activeOpp.stage.id);
        if (!target) return;

        // Commit final position to cache (cross-container insertion may have placed it at the
        // initial-entry index; final index reflects where the user actually released).
        queryClient.setQueryData<Opportunity[]>(QUERY_KEYS.opportunities, prev => {
            if (!prev) return prev;
            return applyMoveToCache(prev, stages, activeOppId, target.toStageId, target.toIndex);
        });

        // No-op detection vs the pre-drag snapshot.
        if (snapshot) {
            const original = snapshot.find(o => o.id === activeOppId);
            if (original && original.stage.id === target.toStageId) {
                const origDest = snapshot
                    .filter(o => o.stage.id === target.toStageId)
                    .sort((a, b) => a.position - b.position);
                const origIdx = origDest.findIndex(o => o.id === activeOppId);
                if (origIdx === target.toIndex) return;
            }
        }

        moveMutation.mutate(
            { opportunityId: activeOppId, toStageId: target.toStageId, toIndex: target.toIndex },
            {
                onError: () => {
                    if (snapshot) queryClient.setQueryData(QUERY_KEYS.opportunities, snapshot);
                    toast.error("Move failed — reverted.");
                },
            },
        );
    };

    const handleDragCancel = () => {
        const snapshot = dragStartSnapshotRef.current;
        dragStartSnapshotRef.current = undefined;
        setActiveId(null);
        if (snapshot) queryClient.setQueryData(QUERY_KEYS.opportunities, snapshot);
    };

    if (stagesPending || oppsPending) return <p>Loading pipeline...</p>;

    const orderedStages = [...stages].sort((a, b) => a.order - b.order);
    const activeOpp = activeId != null ? opportunities.find(o => o.id === activeId) ?? null : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className="sticky top-0 z-30 bg-white h-14 flex items-center gap-2">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => scrollColumns(-1)}
                    disabled={scrollOffset <= 0}
                    aria-label="Scroll left one column"
                >
                    ← Prev
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => scrollColumns(1)}
                    disabled={scrollOffset >= maxOffset}
                    aria-label="Scroll right one column"
                >
                    Next →
                </Button>
            </div>
            <div ref={viewportRef} className="overflow-x-clip pb-2">
                <div
                    ref={trackRef}
                    className="flex gap-4 w-max transition-[margin] duration-300 ease-out"
                    style={{ marginLeft: `-${scrollOffset}px` }}
                >
                    {orderedStages.map(stage => {
                        const stats = stageStats.get(stage.id) ?? { totalValue: 0, expectedValue: 0 };
                        return (
                            <StageColumn
                                key={stage.id}
                                stage={stage}
                                opps={oppsByStage.get(stage.id) ?? []}
                                pipelineTotal={stats.totalValue}
                                expectedTotal={stats.expectedValue}
                            />
                        );
                    })}
                </div>
            </div>
            <DragOverlay>
                {activeOpp ? (
                    <div className="w-72">
                        <TilePresentation opp={activeOpp} withViewDetails={false} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

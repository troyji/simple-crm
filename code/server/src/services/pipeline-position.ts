export const POSITION_EPSILON = 1e-6;

export interface PositionedItem {
    position: number;
}

export function computeInsertPosition(others: PositionedItem[], toIndex: number): number {
    if (others.length === 0) return 1;
    if (toIndex <= 0) return others[0].position - 1;
    if (toIndex >= others.length) return others[others.length - 1].position + 1;
    const prev = others[toIndex - 1].position;
    const next = others[toIndex].position;
    return (prev + next) / 2;
}

export function needsRenormalization(others: PositionedItem[], toIndex: number): boolean {
    if (others.length < 2) return false;
    if (toIndex <= 0 || toIndex >= others.length) return false;
    const prev = others[toIndex - 1].position;
    const next = others[toIndex].position;
    return Math.abs(next - prev) < POSITION_EPSILON;
}

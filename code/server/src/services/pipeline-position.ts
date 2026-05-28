// Lexicographic fractional indexing, backed by the `fractional-indexing` library.
//
// Positions are base-62 strings compared lexicographically. Between any two distinct
// positions there is always another, so reordering only rewrites the moved row —
// neighbours never need to be renormalised. The base-62 alphabet is in ascending ASCII
// order, so SQLite's default BINARY collation sorts these the same way the library does.

export { generateKeyBetween as keyBetween } from "fractional-indexing";

import { generateKeyBetween } from "fractional-indexing";

export interface PositionedItem {
    position: string;
}

export function computeInsertPosition(others: PositionedItem[], toIndex: number): string {
    if (others.length === 0) return generateKeyBetween(null, null);
    if (toIndex <= 0) return generateKeyBetween(null, others[0].position);
    if (toIndex >= others.length) return generateKeyBetween(others[others.length - 1].position, null);
    return generateKeyBetween(others[toIndex - 1].position, others[toIndex].position);
}

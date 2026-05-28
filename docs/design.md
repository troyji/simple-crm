# Pipeline Kanban — Design

## Overview

Replace the tabular Pipeline page with a Kanban board. Columns are Stages (in stage `order`), tiles are Opportunities. Users drag opportunities between stages and reorder within a stage. Ordering is persisted and shared across all users.

## Scope

- **In**: Kanban view replacing the current table at the same route (`/pipeline`). Drag between stages. Drag to reorder within a stage. Per-stage ordering persisted server-side. Drill-in to full opportunity detail.
- **Out**: Create / update / delete of opportunities from the board. The only mutation this page issues is "move" (stage + position). All other CRUD continues to live on the existing screens. Also out: filtering, search, per-user views, archived/closed hiding, bulk move, undo, mobile-optimized drag UX.

## UI

### Layout
- Horizontal row of columns, one per Stage, ordered by `Stage.order`.
- Page header keeps the two summary cards (Total Pipeline Value, Expected Close Value) above the board — they're cheap and useful at a glance.
- Board scrolls horizontally if columns overflow viewport.

### Column header (per stage)
A header panel sits at the top of each column and carries the per-stage summary (the same numbers the table shows today, just relocated):

- Stage name
- Stage status badge (`pending` / `won` / `lost`)
- Count of opportunities in column
- Pipeline $ — sum of `value` for opportunities in the column
- Likelihood — `stage.conversionLikelihood` as a percentage
- Expected $ — sum of `value * conversionLikelihood` for opportunities in the column

Won/lost columns are full drop targets — moving an opportunity into them is the normal way to close it. Their red/green background applies **only to the header panel**, not the column body or the tiles inside.

### Tile (minimal view, read-only)
The current Pipeline view does not render any per-opportunity UI — these tiles are new. Each tile shows:

- Lead name (`opp.lead.name`)
- Opportunity name/description (`opp.name`)
- Expected close date (`opp.expectedCloseDate`)
- A **"View details"** link, styled as a hyperlink (blue text, underlined, pointer cursor), which opens the drill-in.

Tiles do **not** show stage name (redundant with column), value, or custom fields — those live in the drill-in.

The whole tile is the drag handle; the "View details" link suppresses drag (click, not drag) so the user can open detail without accidentally moving the tile.

### Drill-in
- Clicking "View details" opens the existing `OpportunityForm` inside the existing `Dialog` component ([dialog.tsx](code/client/src/components/ui/dialog.tsx)). Save / cancel close the drill-in and return to the board.
- The current `Dialog` is hard-coded to `max-w-md`, which is too narrow for the opportunity form. Extend `Dialog` with an optional `size` prop: `"sm" | "md" | "lg" | "xl"` mapping to Tailwind max-widths (`max-w-md`, `max-w-lg`, `max-w-2xl`, `max-w-4xl`). Default to `"sm"` so every existing caller is unchanged. The opportunity drill-in uses `"lg"` (escalate to `"xl"` during build if it proves cramped).
- Closing the drill-in returns to the board with the tile's position preserved.

### Empty stages
- Render the column with a placeholder ("Drop opportunities here") that is itself a valid drop target.

### Drag behavior
- Library: **`@dnd-kit/core` + `@dnd-kit/sortable`**. Actively maintained, accessible, works with React 18+.
- Drop semantics: the opportunity lands at the exact index where the user dropped it within the destination column (sort is per-stage, not global).
- Optimistic UI: the board updates immediately on drop; if the server rejects, we revert and show a toast.
- Keyboard support comes for free with `@dnd-kit` — leave defaults on; do not invest extra effort here in v1.

## Data model

### Decision: per-opportunity `position` column (not a JSON array on Stage)

Add a column to `Opportunity`:

```ts
@Column("real")
position: number;  // sort order within the opportunity's current stage; ascending
```

Why this over "Stage stores `opportunityOrder: number[]`":
- Reorder is a normal column write, not a JSON array rewrite that can race with other writes.
- No risk of the order list drifting from the actual set of opportunities (create/delete/stage-change keep working without bookkeeping).
- Queries stay flat: `find({ order: { position: "ASC" } })`.

Use `real` (float) so we can insert between two existing positions without rewriting siblings: new position = `(prev + next) / 2`. Endpoints below also accept a "normalize" pathway when positions get too close.

### Migration
- Add `position` column as nullable (TypeORM `synchronize: true` adds it on startup).
- On server startup, run a one-shot guarded backfill: if any `Opportunity` has `position IS NULL`, assign positions `1, 2, 3, ...` within each stage in current `id` order (stable, deterministic, matches today's implicit ordering). The guard means subsequent restarts are no-ops.
- The column stays nullable in the schema; application code treats it as required and the `POST /opportunities` path always sets it on create. (Switching to NOT NULL would require a real migration tool, which this project doesn't use today.)

## API

### `POST /pipeline/move`
Single endpoint, single atomic operation. Handles both "move to another stage" and "reorder within a stage."

**Request**
```json
{
  "opportunityId": 42,
  "toStageId": 3,
  "toIndex": 2
}
```

- `toStageId`: destination stage (may equal current stage for in-column reorder).
- `toIndex`: 0-based index within the destination column **as it will appear after the move**. If `toIndex >= column.length`, append to end.

**Behavior (server)**
1. Load destination column's opportunities ordered by `position`, excluding the moved one.
2. Compute new `position` for the moved opp:
   - If inserting at index 0: `position = first.position - 1`.
   - If appending: `position = last.position + 1`.
   - Else: `position = (prev.position + next.position) / 2`.
3. If the new position is too close to a neighbor (e.g. `|next - prev| < 1e-6`), renormalize the column to integer steps `1..n` in one transaction.
4. Update `opp.stageId` if changed.
5. Return the updated opportunity (with eager-loaded `stage`, `lead`).

**Response**: `200 { opportunity: Opportunity }` on success; `404` if opp or stage missing; `400` for malformed input.

### Existing endpoints
- `GET /opportunities` — extend to return `position` in the payload. Client sorts by `(stage.order, position)` to render the board.
- `GET /pipeline` — keep as-is for the summary cards (totals). The board itself uses `GET /opportunities` + `GET /stages`.
- `POST /opportunities` — when creating, server assigns `position = max(position in stage) + 1` (append to end of that stage's column).
- `PUT /opportunities/:id` — if `stageId` changes via this endpoint (e.g. from the edit form), server appends to the destination stage. The `/pipeline/move` endpoint is the path the board uses; the edit form path is the fallback.
- `DELETE /opportunities/:id` — no special handling needed; remaining positions stay valid (gaps are fine).

## Concurrency

- Last write wins per opportunity. Two users dragging the same opportunity simultaneously will see the later drop overwrite the earlier one — acceptable for a CRM of this scale.
- Two users dragging *different* opportunities into the same column concurrently: both succeed; final order is whatever positions the server computed. Float positions mean inserts don't collide.
- After every successful move, the client invalidates the opportunities query (TanStack Query) so any other tab will refetch on next focus. No live sync / websockets in v1.

## Client architecture

- New component: `features/pipeline/pipeline-board.tsx` — replaces the table block inside `features/pipeline/pipeline.tsx`. The summary cards above stay.
- New component: `features/pipeline/stage-column.tsx` — one column.
- New component: `features/pipeline/opportunity-tile.tsx` — minimal tile (distinct from the existing `OpportunityCard`, which is the full-detail card used on the Leads page).
- New API call: `api/pipeline.ts` → `movePipelineOpportunity({ opportunityId, toStageId, toIndex })`.
- Query keys: reuse `QUERY_KEYS.opportunities` and `QUERY_KEYS.stages`. The move mutation invalidates `opportunities` (and `pipeline` so totals refresh).


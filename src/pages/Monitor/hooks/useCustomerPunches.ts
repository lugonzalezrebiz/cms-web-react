import { useCallback, useState } from "react";

type Range = { start: number; end: number };

export type CustomerGroup = {
  /** Row id of the group's sub-row in the timeline. */
  id: number;
  /** Row the group hangs under (an employee or "Unattended"). */
  parentRowId: number;
  /** "Customer N" number — shared by every row of the same group. */
  number: number;
  /** How many people make up the group. */
  count: number;
};

interface CustomerPunchState {
  groups: CustomerGroup[];
  /** Open sessions: group row id → start second. */
  open: Record<number, number>;
  /** Closed sessions per group row id. */
  closed: Record<number, Range[]>;
}

// `sec` is where the change happened, so undo/redo can move the marker there.
type HistoryEntry = { state: CustomerPunchState; sec: number };

const INITIAL_STATE: CustomerPunchState = { groups: [], open: {}, closed: {} };

// Far below every other row id (employee rows are small negatives, Customer
// punches' fixed rows start at -100_000).
const CUSTOMER_GROUP_ROW_ID_BASE = -200_000;

// Every new sub-row gets an id below all the ones in use, so ids never repeat
// even after a sub-row is dropped.
const nextRowId = (state: CustomerPunchState) =>
  Math.min(CUSTOMER_GROUP_ROW_ID_BASE, ...state.groups.map((g) => g.id)) - 1;

// Freezes a group row's open session at endSec (no-op if it can't).
const closeSession = (
  state: CustomerPunchState,
  groupRowId: number,
  endSec: number,
): CustomerPunchState => {
  const start = state.open[groupRowId];
  if (start === undefined || endSec <= start) return state;
  const { [groupRowId]: _closed, ...open } = state.open;
  return {
    ...state,
    open,
    closed: {
      ...state.closed,
      [groupRowId]: [...(state.closed[groupRowId] ?? []), { start, end: endSec }],
    },
  };
};

// Local state of the Customer punches groups and their session bars, with
// undo/redo history. A group moved to another row keeps its past under the
// previous row, so one group can span several sub-rows (same number/count,
// different ids) — but at most one per parent row.
// Nothing is persisted to the backend yet.
export const useCustomerPunches = () => {
  const [present, setPresent] = useState<CustomerPunchState>(INITIAL_STATE);
  const [past, setPast] = useState<HistoryEntry[]>([]);
  const [future, setFuture] = useState<HistoryEntry[]>([]);

  const commit = useCallback(
    (next: CustomerPunchState, sec: number) => {
      if (next === present) return;
      setPast((p) => [...p, { state: present, sec }]);
      setFuture([]);
      setPresent(next);
    },
    [present],
  );

  // Adds "Customer N (count)" under parentRowId and opens its session at startSec.
  const addGroup = useCallback(
    (parentRowId: number, count: number, startSec: number) => {
      const id = nextRowId(present);
      const number = Math.max(0, ...present.groups.map((g) => g.number)) + 1;
      commit(
        {
          ...present,
          groups: [...present.groups, { id, parentRowId, number, count }],
          open: { ...present.open, [id]: startSec },
        },
        startSec,
      );
    },
    [present, commit],
  );

  // Freezes the group's open session at endSec.
  const punchOut = useCallback(
    (groupRowId: number, endSec: number) => {
      commit(closeSession(present, groupRowId, endSec), endSec);
    },
    [present, commit],
  );

  // Hands a group over to another row at atSec (e.g. from "Unattended" to
  // the employee who ended up attending it): what's been tracked so far stays
  // closed under the previous row, and the group continues under the new row
  // from atSec — on the sub-row it already has there if it was attended by
  // that row before, otherwise on a new one.
  const changeParent = useCallback(
    (groupRowId: number, parentRowId: number, atSec: number) => {
      const group = present.groups.find((g) => g.id === groupRowId);
      if (!group || group.parentRowId === parentRowId) return;
      const start = present.open[groupRowId];
      const existingRow = present.groups.find(
        (g) => g.number === group.number && g.parentRowId === parentRowId,
      );
      const tracked = start !== undefined && atSec > start;

      // Nothing tracked yet on this row: hand over its open session as-is.
      if (!tracked) {
        if (!existingRow) {
          commit(
            {
              ...present,
              groups: present.groups.map((g) =>
                g.id === groupRowId ? { ...g, parentRowId } : g,
              ),
            },
            atSec,
          );
          return;
        }
        const { [groupRowId]: _moved, ...open } = present.open;
        commit(
          {
            ...present,
            open:
              start !== undefined ? { ...open, [existingRow.id]: start } : open,
            // Drop the row it leaves behind if it has no history of its own.
            groups:
              (present.closed[groupRowId] ?? []).length === 0
                ? present.groups.filter((g) => g.id !== groupRowId)
                : present.groups,
          },
          atSec,
        );
        return;
      }

      const afterClose = closeSession(present, groupRowId, atSec);
      if (existingRow) {
        commit(
          { ...afterClose, open: { ...afterClose.open, [existingRow.id]: atSec } },
          atSec,
        );
        return;
      }
      const id = nextRowId(afterClose);
      commit(
        {
          ...afterClose,
          groups: [...afterClose.groups, { ...group, id, parentRowId }],
          open: { ...afterClose.open, [id]: atSec },
        },
        atSec,
      );
    },
    [present, commit],
  );

  // A punched-out group coming back: continues as the same "Customer N" under
  // parentRowId from startSec — on its sub-row there if it has one, otherwise
  // on a new one with the given count.
  const reEnter = useCallback(
    (number: number, parentRowId: number, count: number, startSec: number) => {
      const rows = present.groups.filter((g) => g.number === number);
      if (rows.length === 0 || rows.some((g) => present.open[g.id] !== undefined))
        return;
      const existingRow = rows.find((g) => g.parentRowId === parentRowId);
      if (existingRow) {
        const overlaps = (present.closed[existingRow.id] ?? []).some(
          (r) => startSec >= r.start && startSec < r.end,
        );
        if (overlaps) return;
        commit(
          { ...present, open: { ...present.open, [existingRow.id]: startSec } },
          startSec,
        );
        return;
      }
      const id = nextRowId(present);
      commit(
        {
          ...present,
          groups: [...present.groups, { id, parentRowId, number, count }],
          open: { ...present.open, [id]: startSec },
        },
        startSec,
      );
    },
    [present, commit],
  );

  // Removes the bar starting at startSec on a group row (open or closed); a
  // row left with no bars at all is dropped.
  const deleteSession = useCallback(
    (groupRowId: number, startSec: number) => {
      const isOpen = present.open[groupRowId] === startSec;
      const ranges = present.closed[groupRowId] ?? [];
      if (!isOpen && !ranges.some((r) => r.start === startSec)) return;
      const { [groupRowId]: _deleted, ...otherOpen } = present.open;
      const open = isOpen ? otherOpen : present.open;
      const remaining = isOpen
        ? ranges
        : ranges.filter((r) => r.start !== startSec);
      const isEmpty = open[groupRowId] === undefined && remaining.length === 0;
      commit(
        {
          groups: isEmpty
            ? present.groups.filter((g) => g.id !== groupRowId)
            : present.groups,
          open,
          closed: { ...present.closed, [groupRowId]: remaining },
        },
        startSec,
      );
    },
    [present, commit],
  );

  // Moves the ends of the bar that starts at oldStart on a group row (an open
  // bar only has its start).
  const updateSession = useCallback(
    (
      groupRowId: number,
      oldStart: number,
      next: { start: number; end?: number },
    ) => {
      if (present.open[groupRowId] === oldStart) {
        commit(
          { ...present, open: { ...present.open, [groupRowId]: next.start } },
          next.start,
        );
        return;
      }
      const { end } = next;
      const ranges = present.closed[groupRowId] ?? [];
      if (end === undefined || !ranges.some((r) => r.start === oldStart)) return;
      commit(
        {
          ...present,
          closed: {
            ...present.closed,
            [groupRowId]: ranges.map((r) =>
              r.start === oldStart ? { start: next.start, end } : r,
            ),
          },
        },
        next.start,
      );
    },
    [present, commit],
  );

  const undo = useCallback((): number | void => {
    const last = past[past.length - 1];
    if (!last) return;
    setPast(past.slice(0, -1));
    setFuture((f) => [...f, { state: present, sec: last.sec }]);
    setPresent(last.state);
    return last.sec;
  }, [past, present]);

  const redo = useCallback((): number | void => {
    const next = future[future.length - 1];
    if (!next) return;
    setFuture(future.slice(0, -1));
    setPast((p) => [...p, { state: present, sec: next.sec }]);
    setPresent(next.state);
    return next.sec;
  }, [future, present]);

  return {
    groups: present.groups,
    openSessions: present.open,
    closedSessions: present.closed,
    addGroup,
    punchOut,
    changeParent,
    reEnter,
    deleteSession,
    updateSession,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
};

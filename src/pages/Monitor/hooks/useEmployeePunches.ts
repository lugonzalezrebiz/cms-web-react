import { useCallback, useState } from "react";
import { EMPLOYEE_TRACKS } from "../../../components/timeline/constants";
import type { TimelineSnapshot } from "../../../components/timeline/types";

type Range = { start: number; end: number };

interface PunchState {
  tracks: TimelineSnapshot["timeline"]["tracks"];
  /** Open (punched-in) sessions: row id → start second. */
  open: Record<number, number>;
  /** Closed sessions per row id. */
  closed: Record<number, Range[]>;
  /** Employee id → its row id, so a known employee reuses the same row. */
  employeeRows: Record<number, number>;
}

// `sec` is where the change happened, so undo/redo can move the marker there.
type HistoryEntry = { state: PunchState; sec: number };

const INITIAL_STATE: PunchState = {
  tracks: EMPLOYEE_TRACKS,
  open: {},
  closed: {},
  employeeRows: {},
};

const overlapsClosed = (state: PunchState, rowId: number, sec: number) =>
  (state.closed[rowId] ?? []).some((r) => sec >= r.start && sec < r.end);

// Local state of the Employee punches timeline (rows + session bars) with
// undo/redo history. Nothing is persisted to the backend yet.
export const useEmployeePunches = () => {
  const [present, setPresent] = useState<PunchState>(INITIAL_STATE);
  const [past, setPast] = useState<HistoryEntry[]>([]);
  const [future, setFuture] = useState<HistoryEntry[]>([]);
  const [focusedRowId, setFocusedRowId] = useState<number | null>(null);

  const commit = useCallback(
    (next: PunchState, sec: number) => {
      setPast((p) => [...p, { state: present, sec }]);
      setFuture([]);
      setPresent(next);
    },
    [present],
  );

  // Adds an "Unknown NNN" row and opens its session at startSec.
  const addUnknownEmployee = useCallback(
    (startSec: number) => {
      const unknownCount =
        present.tracks.filter((t) => t.name.startsWith("Unknown ")).length + 1;
      // Negative ids can't collide with camera ids, which event points reference.
      const id = -(present.tracks.length + 1);
      commit(
        {
          ...present,
          tracks: [
            ...present.tracks,
            {
              id,
              name: `Unknown ${String(unknownCount).padStart(3, "0")}`,
              category: "employees",
              sessions: [],
            },
          ],
          open: { ...present.open, [id]: startSec },
        },
        startSec,
      );
      setFocusedRowId(id);
    },
    [present, commit],
  );

  // Punches in a known employee: reuses their row if they already have one,
  // otherwise adds a row with their name. Returns false if nothing changed.
  const addEmployee = useCallback(
    (employee: { id: number; name: string }, startSec: number) => {
      const existingRowId = present.employeeRows[employee.id];
      if (existingRowId !== undefined) {
        setFocusedRowId(existingRowId);
        if (
          present.open[existingRowId] !== undefined ||
          overlapsClosed(present, existingRowId, startSec)
        )
          return false;
        commit(
          { ...present, open: { ...present.open, [existingRowId]: startSec } },
          startSec,
        );
        return true;
      }

      const id = -(present.tracks.length + 1);
      commit(
        {
          ...present,
          tracks: [
            ...present.tracks,
            { id, name: employee.name, category: "employees", sessions: [] },
          ],
          open: { ...present.open, [id]: startSec },
          employeeRows: { ...present.employeeRows, [employee.id]: id },
        },
        startSec,
      );
      setFocusedRowId(id);
      return true;
    },
    [present, commit],
  );

  // Opens a new session on an existing row, unless one is already open there
  // or startSec falls inside one of its closed bars.
  const punchIn = useCallback(
    (rowId: number, startSec: number) => {
      if (present.open[rowId] !== undefined) return false;
      if (overlapsClosed(present, rowId, startSec)) return false;
      commit({ ...present, open: { ...present.open, [rowId]: startSec } }, startSec);
      return true;
    },
    [present, commit],
  );

  // Freezes the row's open session at endSec.
  const punchOut = useCallback(
    (rowId: number, endSec: number) => {
      const start = present.open[rowId];
      if (start === undefined || endSec <= start) return;
      const { [rowId]: _closed, ...open } = present.open;
      commit(
        {
          ...present,
          open,
          closed: {
            ...present.closed,
            [rowId]: [...(present.closed[rowId] ?? []), { start, end: endSec }],
          },
        },
        endSec,
      );
    },
    [present, commit],
  );

  // Removes the bar starting at startSec on the row (open or closed). The row
  // stays, so its employee keeps the same line.
  const deleteSession = useCallback(
    (rowId: number, startSec: number) => {
      if (present.open[rowId] === startSec) {
        const { [rowId]: _deleted, ...open } = present.open;
        commit({ ...present, open }, startSec);
        return;
      }
      const ranges = present.closed[rowId] ?? [];
      if (!ranges.some((r) => r.start === startSec)) return;
      commit(
        {
          ...present,
          closed: {
            ...present.closed,
            [rowId]: ranges.filter((r) => r.start !== startSec),
          },
        },
        startSec,
      );
    },
    [present, commit],
  );

  // Moves the ends of the bar that starts at oldStart on the row (an open bar
  // only has its start). The timeline already keeps it clear of the row's
  // other bars.
  const updateSession = useCallback(
    (rowId: number, oldStart: number, next: { start: number; end?: number }) => {
      if (present.open[rowId] === oldStart) {
        commit(
          { ...present, open: { ...present.open, [rowId]: next.start } },
          next.start,
        );
        return;
      }
      const { end } = next;
      const ranges = present.closed[rowId] ?? [];
      if (end === undefined || !ranges.some((r) => r.start === oldStart)) return;
      commit(
        {
          ...present,
          closed: {
            ...present.closed,
            [rowId]: ranges.map((r) =>
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
    tracks: present.tracks,
    openSessions: present.open,
    closedSessions: present.closed,
    employeeRows: present.employeeRows,
    focusedRowId,
    addUnknownEmployee,
    addEmployee,
    punchIn,
    punchOut,
    deleteSession,
    updateSession,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
};

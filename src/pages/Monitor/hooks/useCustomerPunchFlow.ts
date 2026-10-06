import { useCallback, useMemo, useState, type ComponentProps } from "react";
import type CustomerPunchDialog from "../../../components/timeline/CustomerPunchDialog";
import type CustomerReEnterDialog from "../../../components/timeline/CustomerReEnterDialog";
import type { ReEnterCustomer } from "../../../components/timeline/CustomerReEnterDialog";
import {
  CUSTOMER_COUNT_OPTIONS,
  EMPLOYEE_DIALOG_CAMERA_SLOTS,
  MOCK_DIALOG_EMPLOYEES,
} from "../../../components/timeline/constants";
import type { TimelineSnapshot } from "../../../components/timeline/types";
import { secToTimeString } from "../../../components/timeline/utils";
import { assetUrl } from "../../../utils";
import {
  EMPLOYEES_CUSTOMERS_EMPTY_GRID_MESSAGE,
  CUSTOMER_EMPLOYEE_ROW_ID_BASE,
  UNATTENDED_ROW_ID,
  BACK_ROOM_ROW_ID,
  BACK_ROOM_BREAK_ROW_ID_BASE,
  EMPLOYEE_AT_WORK_HINT,
  EMPLOYEE_ON_BREAK_HINT,
  PUNCH_IN_CUSTOMER_HINT,
  type TimelineTabProps,
} from "../constants";
import { useCustomerPunches } from "./useCustomerPunches";
import type { RowNotice } from "../../../components/timeline/rows/SessionRow";

type Range = { start: number; end: number };

const OUTSIDE_PUNCH_TIME_NOTICE =
  "Not possible: outside the employee's punch-in time";
const WALL_NOTICE = "Employee punched out here — punch out the customer first";
const ATTENDING_CUSTOMER_NOTICE = "Not possible: punch out the customer first";
const CUSTOMER_UNDER_NOTICE = "Not possible: delete the customer first";

interface Params {
  /** Current marker: where attendance changes happen. */
  markerSec: number;
  // Employee punches state: who exists and when each one is punched in.
  employeeTracks: TimelineSnapshot["timeline"]["tracks"];
  employeeOpenSessions: Record<number, number>;
  employeeClosedSessions: Record<number, Range[]>;
  employeeRows: Record<number, number>;
  /** Opens Employee punches' add-employee dialog (Employee and Customer tab). */
  onAddEmployee?: () => void;
  /** Employee punches' bar actions and history, for the employee lines of
   * the Employee and Customer tab. */
  employeeControls?: {
    punchIn: (rowId: number, startSec: number) => boolean;
    punchOut: (rowId: number, endSec: number) => void;
    deleteSession: (rowId: number, startSec: number) => void;
    updateSession: (
      rowId: number,
      oldStart: number,
      next: { start: number; end?: number },
    ) => void;
    undo: () => number | void;
    redo: () => number | void;
    lastUndoAt?: number;
    lastRedoAt?: number;
    // Back Room breaks (B / S), by Employee punches row id.
    breakOpen: Record<number, number>;
    breakClosed: Record<number, Range[]>;
    startBreak: (rowId: number, sec: number) => boolean;
    finishBreak: (rowId: number, sec: number, backToWork: boolean) => boolean;
    /** Employee punches row just added, to select it here too. */
    focused: { rowId: number; key: number } | null;
  };
}

// Everything the Customer punches tab needs: its rows (employees + customer
// groups), the attendance rules against Employee punches, the Customer Punch
// in / Re-Enter dialogs, and the TimeLine props for the tab.
export const useCustomerPunchFlow = ({
  markerSec,
  employeeTracks,
  employeeOpenSessions,
  employeeClosedSessions,
  employeeRows,
  onAddEmployee,
  employeeControls,
}: Params) => {
  const {
    groups,
    openSessions,
    closedSessions,
    addGroup,
    punchOut,
    changeParent,
    reEnter,
    deleteSession,
    updateSession,
    undo,
    redo,
    canUndo,
    canRedo,
    lastUndoAt,
    lastRedoAt,
  } = useCustomerPunches();

  // Rows: "Unattended" first, then only the employees punched in on Employee
  // punches (known and Unknown, in that list's order) — each followed by the
  // customer groups punched in under it.
  const { tracks, reassignOptions, punchRowIds } = useMemo(() => {
    const employeeRowIds = new Set(Object.values(employeeRows));
    // Employee punches row → known employee id.
    const employeeIdByRow = new Map(
      Object.entries(employeeRows).map(([employeeId, rowId]) => [
        rowId,
        Number(employeeId),
      ]),
    );
    const parents = [
      {
        id: UNATTENDED_ROW_ID,
        name: "Unattended",
        category: "customers" as const,
        sessions: [],
      },
      ...employeeTracks.map((t) => {
        const employeeId = employeeIdByRow.get(t.id);
        return {
          ...t,
          // Known employees keep a stable Customer punches id of their own.
          id:
            employeeId !== undefined
              ? CUSTOMER_EMPLOYEE_ROW_ID_BASE - employeeId
              : t.id,
          category: "customers" as const,
        };
      }),
    ];
    const tracks = parents.flatMap((parent) => [
      parent,
      ...groups
        .filter((g) => g.parentRowId === parent.id)
        .map((g) => ({
          id: g.id,
          name: `Customer ${g.number} (${g.count})`,
          category: "customers" as const,
          sessions: [],
          parentId: parent.id,
        })),
    ]);
    // A group's attendance button lists every row it can be moved to.
    const reassignOptions = parents.map((p) => ({ id: p.id, label: p.name }));
    // Customer punches row → the employee's Employee punches row (its sessions
    // say when they're punched in). Unknown employees share the same id.
    const punchRowIds = new Map<number, number>();
    for (const employee of MOCK_DIALOG_EMPLOYEES) {
      const punchRowId = employeeRows[employee.id];
      if (punchRowId !== undefined)
        punchRowIds.set(CUSTOMER_EMPLOYEE_ROW_ID_BASE - employee.id, punchRowId);
    }
    for (const t of employeeTracks) {
      if (!employeeRowIds.has(t.id)) punchRowIds.set(t.id, t.id);
    }
    return { tracks, reassignOptions, punchRowIds };
  }, [employeeRows, employeeTracks, groups]);

  // Customers can only be attended by "Unattended" or by an employee who is
  // punched in (open session already started, or a closed one) at that time.
  const canAttendAt = useCallback(
    (customerRowId: number, sec: number) => {
      if (customerRowId === UNATTENDED_ROW_ID) return true;
      const punchRowId = punchRowIds.get(customerRowId);
      if (punchRowId === undefined) return false;
      const openStart = employeeOpenSessions[punchRowId];
      if (openStart !== undefined && sec >= openStart) return true;
      return (employeeClosedSessions[punchRowId] ?? []).some(
        (r) => sec >= r.start && sec <= r.end,
      );
    },
    [punchRowIds, employeeOpenSessions, employeeClosedSessions],
  );

  // A customer group can't be tracked past the punch-out of the employee
  // attending it: the earliest such punch-out among open groups is a wall the
  // marker can't pass. Employees still punched in (open session) set no limit.
  // `wallRowId` is the row of the employee whose punch-out sets it.
  const { sessionWallSec, wallRowId } = useMemo(() => {
    let wall: number | undefined;
    let wallRowId: number | undefined;
    for (const group of groups) {
      const groupStart = openSessions[group.id];
      if (groupStart === undefined || group.parentRowId === UNATTENDED_ROW_ID)
        continue;
      const punchRowId = punchRowIds.get(group.parentRowId);
      if (punchRowId === undefined) continue;
      const employeeStart = employeeOpenSessions[punchRowId];
      if (employeeStart !== undefined && groupStart >= employeeStart) continue;
      const shift = (employeeClosedSessions[punchRowId] ?? []).find(
        (r) => groupStart >= r.start && groupStart <= r.end,
      );
      if (shift && (wall === undefined || shift.end < wall)) {
        wall = shift.end;
        wallRowId = group.parentRowId;
      }
    }
    return { sessionWallSec: wall, wallRowId };
  }, [
    groups,
    openSessions,
    punchRowIds,
    employeeOpenSessions,
    employeeClosedSessions,
  ]);

  // Editing a customer's bar: when an employee attends it, its ends stay
  // inside that employee's shift (the one the bar starts in). "Unattended"
  // sets no limit.
  const getSessionBounds = useCallback(
    (rowId: number, start: number) => {
      const group = groups.find((g) => g.id === rowId);
      if (!group || group.parentRowId === UNATTENDED_ROW_ID) return undefined;
      const punchRowId = punchRowIds.get(group.parentRowId);
      if (punchRowId === undefined) return undefined;
      const openStart = employeeOpenSessions[punchRowId];
      if (openStart !== undefined && start >= openStart)
        return { min: openStart, max: Infinity };
      const shift = (employeeClosedSessions[punchRowId] ?? []).find(
        (r) => start >= r.start && start <= r.end,
      );
      return shift ? { min: shift.start, max: shift.end } : undefined;
    },
    [groups, punchRowIds, employeeOpenSessions, employeeClosedSessions],
  );

  // The marker can't go back before the latest start among open customers (a
  // punch-in, or a hand-over to another row), so a bar still being built
  // never ends before it begins.
  const sessionFloorSec = useMemo(() => {
    const starts = Object.values(openSessions);
    return starts.length > 0 ? Math.max(...starts) : undefined;
  }, [openSessions]);

  // Attendance menu options at the marker: rows that can't attend are disabled.
  const reassignOptionsAtMarker = useMemo(
    () =>
      reassignOptions.map((option) => ({
        ...option,
        disabled: !canAttendAt(option.id, markerSec),
      })),
    [reassignOptions, canAttendAt, markerSec],
  );

  // Attendance change from a group's button: hands it over at the marker,
  // only to a row that can attend at that time.
  const handleChangeParent = useCallback(
    (groupRowId: number, parentRowId: number) => {
      if (!canAttendAt(parentRowId, markerSec)) return;
      // The sub-row the group continues on, to select it there.
      return changeParent(groupRowId, parentRowId, markerSec);
    },
    [canAttendAt, changeParent, markerSec],
  );

  // Row to select next in Employees & Customers: whatever was just created
  // here (a customer, an employee's break line), keyed so it applies again.
  const [focus, setFocus] = useState<{ rowId: number; key: number } | null>(
    null,
  );
  const focusOn = useCallback(
    (rowId: number) => setFocus({ rowId, key: Date.now() }),
    [],
  );

  // Customer Punch in dialog: opened by C on an employee or Unattended, for
  // that row at the marker.
  const [punchTarget, setPunchTarget] = useState<{
    rowId: number;
    sec: number;
  } | null>(null);
  const [punchCount, setPunchCount] = useState(CUSTOMER_COUNT_OPTIONS[0]);

  // Message at the marker when "i" is pressed on an employee who isn't
  // punched in at that time.
  const [notice, setNotice] = useState<RowNotice | undefined>(undefined);

  // While the marker sits on the wall, the employee whose punch-out sets it
  // says why it can't go further.
  const wallNotice = useMemo(
    (): RowNotice | undefined =>
      sessionWallSec !== undefined &&
      wallRowId !== undefined &&
      markerSec >= sessionWallSec
        ? { rowId: wallRowId, text: WALL_NOTICE, key: 0, sticky: true }
        : undefined,
    [sessionWallSec, wallRowId, markerSec],
  );

  // Returns false: the timeline shouldn't enter a punched-in state for this row.
  // Only opens for "Unattended" or an employee punched in at that time.
  const handleOpenPunch = useCallback(
    (rowId: number, sec: number) => {
      if (canAttendAt(rowId, sec)) {
        setPunchTarget({ rowId, sec });
      } else {
        setNotice({ rowId, text: OUTSIDE_PUNCH_TIME_NOTICE, key: Date.now() });
      }
      return false;
    },
    [canAttendAt],
  );

  // Customers that can re-enter: groups with no open session, each with the
  // row that attended it last and when it punched out there.
  const reEnterCustomers = useMemo((): ReEnterCustomer[] => {
    const rowNames = new Map(reassignOptions.map((o) => [o.id, o.label]));
    const numbers = [...new Set(groups.map((g) => g.number))].sort(
      (a, b) => a - b,
    );
    return numbers.flatMap((number) => {
      const rows = groups.filter((g) => g.number === number);
      if (rows.some((g) => openSessions[g.id] !== undefined)) return [];
      let last: { row: (typeof rows)[number]; end: number } | undefined;
      for (const row of rows) {
        for (const range of closedSessions[row.id] ?? []) {
          if (!last || range.end > last.end) last = { row, end: range.end };
        }
      }
      if (!last) return [];
      return [
        {
          number,
          count: last.row.count,
          attendedBy: rowNames.get(last.row.parentRowId) ?? "",
          punchedOut: secToTimeString(last.end).slice(0, 5),
        },
      ];
    });
  }, [groups, openSessions, closedSessions, reassignOptions]);

  // "Select customer if Re-Enter" picker, opened from the Customer Punch in
  // dialog (which hides meanwhile) and returning to it with the pick.
  const [isReEnterOpen, setIsReEnterOpen] = useState(false);
  const [reEnterPickNumber, setReEnterPickNumber] = useState<number | null>(
    null,
  );
  const [reEnterCamera, setReEnterCamera] = useState(0);
  const [reEnterNumber, setReEnterNumber] = useState<number | null>(null);
  const reEnterCustomer =
    reEnterCustomers.find((c) => c.number === reEnterNumber) ?? null;

  const handleOpenReEnter = useCallback(() => {
    setReEnterPickNumber(reEnterNumber);
    setIsReEnterOpen(true);
  }, [reEnterNumber]);

  const handleCloseReEnter = useCallback(() => {
    setIsReEnterOpen(false);
    setReEnterCamera(0);
  }, []);

  // Back to Customer Punch in with the picked customer (and its group size).
  const handleConfirmReEnter = useCallback(() => {
    const picked = reEnterCustomers.find((c) => c.number === reEnterPickNumber);
    if (!picked) return;
    setReEnterNumber(picked.number);
    setPunchCount(picked.count);
    handleCloseReEnter();
  }, [reEnterCustomers, reEnterPickNumber, handleCloseReEnter]);

  const handleClosePunch = useCallback(() => {
    setPunchTarget(null);
    setPunchCount(CUSTOMER_COUNT_OPTIONS[0]);
    setReEnterNumber(null);
  }, []);

  // "Punch In": under the row "i" was pressed on, with its session opened
  // where the marker was — continuing the re-entering customer if one was
  // picked, otherwise as a new "Customer N (count)".
  const handleConfirmPunch = useCallback(() => {
    if (punchTarget === null) return;
    const { rowId, sec } = punchTarget;
    const groupRowId = reEnterCustomer
      ? reEnter(reEnterCustomer.number, rowId, punchCount, sec)
      : addGroup(rowId, punchCount, sec);
    // The customer just punched in gets picked.
    if (groupRowId !== undefined) focusOn(groupRowId);
    handleClosePunch();
  }, [
    punchTarget,
    punchCount,
    reEnterCustomer,
    reEnter,
    addGroup,
    focusOn,
    handleClosePunch,
  ]);

  // Employees & Customers rows: "Back Room" (employees on a break), then
  // "Unattended" and the punched-in employees, each with its customer groups
  // — where the employee lines also show their Employee punches bars.
  // Unattended reads greyed out until there's an employee, Back Room until
  // it holds one.
  const hasEmployees = employeeTracks.length > 0;
  const breakOpen = employeeControls?.breakOpen;
  const breakClosed = employeeControls?.breakClosed;

  // Employee lines ↔ their Employee punches rows, and each employee who has
  // been to the Back Room (B) gets a line under it with their breaks.
  const { lineIdByPunchRow, breakTracks, breakPunchRowIds } = useMemo(() => {
    const lineIdByPunchRow = new Map<number, number>();
    for (const [lineId, punchRowId] of punchRowIds)
      lineIdByPunchRow.set(punchRowId, lineId);
    const breakPunchRowIds = new Map<number, number>();
    const breakTracks = tracks.flatMap((t) => {
      const punchRowId = punchRowIds.get(t.id);
      if (punchRowId === undefined) return [];
      const hasBreaks =
        breakOpen?.[punchRowId] !== undefined ||
        (breakClosed?.[punchRowId]?.length ?? 0) > 0;
      if (!hasBreaks) return [];
      const id = BACK_ROOM_BREAK_ROW_ID_BASE + punchRowId;
      breakPunchRowIds.set(id, punchRowId);
      return [
        {
          id,
          name: t.name,
          category: "customers" as const,
          sessions: [],
          parentId: BACK_ROOM_ROW_ID,
        },
      ];
    });
    return { lineIdByPunchRow, breakTracks, breakPunchRowIds };
  }, [tracks, punchRowIds, breakOpen, breakClosed]);

  const employeesCustomersTracks = useMemo(
    () => [
      {
        id: BACK_ROOM_ROW_ID,
        name: "Back Room",
        category: "customers" as const,
        sessions: [],
        // Only selectable once it holds an employee (someone went on a break).
        inactive: breakTracks.length === 0,
      },
      ...breakTracks,
      ...tracks.map((t) =>
        t.id === UNATTENDED_ROW_ID ? { ...t, inactive: !hasEmployees } : t,
      ),
    ],
    [tracks, breakTracks, hasEmployees],
  );

  // Customer groups' sessions plus each employee line's own punches and each
  // break line's breaks, keyed by this tab's row ids.
  const { employeesCustomersOpen, employeesCustomersClosed } = useMemo(() => {
    const open = { ...openSessions };
    const closed = { ...closedSessions };
    for (const [rowId, punchRowId] of punchRowIds) {
      const start = employeeOpenSessions[punchRowId];
      if (start !== undefined) open[rowId] = start;
      const ranges = employeeClosedSessions[punchRowId];
      if (ranges) closed[rowId] = ranges;
    }
    for (const [rowId, punchRowId] of breakPunchRowIds) {
      const start = breakOpen?.[punchRowId];
      if (start !== undefined) open[rowId] = start;
      const ranges = breakClosed?.[punchRowId];
      if (ranges) closed[rowId] = ranges;
    }
    return { employeesCustomersOpen: open, employeesCustomersClosed: closed };
  }, [
    openSessions,
    closedSessions,
    punchRowIds,
    employeeOpenSessions,
    employeeClosedSessions,
    breakPunchRowIds,
    breakOpen,
    breakClosed,
  ]);

  // B (on an employee line): off to the Back Room — Back Room gets selected.
  // S (on Back Room with the employee's break sub-selected, or on the
  // employee line): back to work — their line gets selected.
  // C (on an employee line or Unattended): the Customer Punch in dialog, to
  // give them a customer (with the attendance rules).
  const startBreak = employeeControls?.startBreak;
  const finishBreak = employeeControls?.finishBreak;
  const handleRowKey = useCallback(
    (key: string, lineId: number, subRowId: number | null, sec: number) => {
      if (key === "c") {
        if (lineId !== UNATTENDED_ROW_ID && !punchRowIds.has(lineId))
          return false;
        handleOpenPunch(lineId, sec);
        return true;
      }
      if (key === "b") {
        const punchRowId = punchRowIds.get(lineId);
        if (punchRowId === undefined) return false;
        // No break while attending a customer: punch them out first.
        const isAttending = groups.some(
          (g) => g.parentRowId === lineId && openSessions[g.id] !== undefined,
        );
        if (isAttending) {
          setNotice({
            rowId: lineId,
            text: ATTENDING_CUSTOMER_NOTICE,
            key: Date.now(),
          });
          return true;
        }
        // Their break line under Back Room gets picked (not Back Room).
        if (startBreak?.(punchRowId, sec))
          focusOn(BACK_ROOM_BREAK_ROW_ID_BASE + punchRowId);
        return true;
      }
      if (key === "s") {
        const punchRowId =
          lineId === BACK_ROOM_ROW_ID
            ? subRowId !== null
              ? breakPunchRowIds.get(subRowId)
              : undefined
            : punchRowIds.get(lineId);
        if (punchRowId === undefined) return false;
        if (!finishBreak?.(punchRowId, sec, true)) return true;
        return lineIdByPunchRow.get(punchRowId) ?? true;
      }
      return false;
    },
    [
      punchRowIds,
      breakPunchRowIds,
      lineIdByPunchRow,
      startBreak,
      finishBreak,
      handleOpenPunch,
      focusOn,
      groups,
      openSessions,
    ],
  );

  // Hints next to the marker: an employee at work can go on a break or punch
  // out; one on a break can come back.
  const getOpenHint = useCallback(
    (rowId: number) => {
      if (punchRowIds.has(rowId)) return EMPLOYEE_AT_WORK_HINT;
      if (breakPunchRowIds.has(rowId)) return EMPLOYEE_ON_BREAK_HINT;
      return undefined;
    },
    [punchRowIds, breakPunchRowIds],
  );

  // Unattended, when selected, says how to punch a customer in.
  const getSelectedHint = useCallback(
    (rowId: number) =>
      rowId === UNATTENDED_ROW_ID ? PUNCH_IN_CUSTOMER_HINT : undefined,
    [],
  );

  // With one of its customers picked, the line (Unattended or an employee)
  // still says how to add another with C.
  const getParentHint = useCallback(
    (rowId: number) =>
      rowId === UNATTENDED_ROW_ID || punchRowIds.has(rowId)
        ? PUNCH_IN_CUSTOMER_HINT
        : undefined,
    [punchRowIds],
  );

  // Only customer groups change attendance; Back Room break lines don't.
  const canReassignRow = useCallback(
    (rowId: number) => !breakPunchRowIds.has(rowId),
    [breakPunchRowIds],
  );

  // What gets selected: whatever was created last — a customer or a break
  // line here, or an employee just added (or re-added) with "+" / "i".
  const employeeFocused = employeeControls?.focused;
  const employeesCustomersFocusRow = useMemo(() => {
    const employeeLineId =
      employeeFocused != null
        ? lineIdByPunchRow.get(employeeFocused.rowId)
        : undefined;
    const employeeFocus =
      employeeFocused != null && employeeLineId !== undefined
        ? { rowId: employeeLineId, key: employeeFocused.key }
        : null;
    if (!focus) return employeeFocus ?? undefined;
    if (!employeeFocus) return focus;
    return employeeFocus.key > focus.key ? employeeFocus : focus;
  }, [focus, employeeFocused, lineIdByPunchRow]);

  // "i" builds employees: on an employee who has punched out (not working, not
  // on a break) it starts a new bar for them at the marker; anywhere else it
  // opens the add-employee dialog. Customers are punched in with C.
  const employeePunchIn = employeeControls?.punchIn;
  const handleOpenPunchHere = useCallback(
    (rowId: number, sec: number) => {
      const punchRowId = punchRowIds.get(rowId);
      const isFinished =
        punchRowId !== undefined &&
        employeeOpenSessions[punchRowId] === undefined &&
        breakOpen?.[punchRowId] === undefined;
      if (isFinished) return employeePunchIn?.(punchRowId, sec) ?? false;
      onAddEmployee?.();
      return false;
    },
    [punchRowIds, employeeOpenSessions, breakOpen, employeePunchIn, onAddEmployee],
  );

  // An employee line's bar is an Employee punches session; anything else is a
  // customer group's.
  // "o" on a break line punches them out of the Back Room (no return).
  const punchOutHere = useCallback(
    (rowId: number, endSec: number) => {
      const breakPunchRowId = breakPunchRowIds.get(rowId);
      if (breakPunchRowId !== undefined) {
        finishBreak?.(breakPunchRowId, endSec, false);
        return;
      }
      const punchRowId = punchRowIds.get(rowId);
      if (punchRowId === undefined) {
        punchOut(rowId, endSec);
        return;
      }
      employeeControls?.punchOut(punchRowId, endSec);
      // An employee punched out hands the selection to the employee above.
      const employeeLineIds = tracks
        .filter((t) => punchRowIds.has(t.id))
        .map((t) => t.id);
      const above = employeeLineIds[employeeLineIds.indexOf(rowId) - 1];
      if (above !== undefined) focusOn(above);
    },
    [
      breakPunchRowIds,
      finishBreak,
      punchRowIds,
      punchOut,
      employeeControls,
      tracks,
      focusOn,
    ],
  );
  // An employee's bar with a customer of theirs within it (delete that
  // first).
  const hasCustomerUnder = useCallback(
    (rowId: number, startSec: number) => {
      const punchRowId = punchRowIds.get(rowId);
      if (punchRowId === undefined) return false;
      const barEnd =
        employeeOpenSessions[punchRowId] === startSec
          ? Infinity
          : (employeeClosedSessions[punchRowId] ?? []).find(
              (r) => r.start === startSec,
            )?.end;
      if (barEnd === undefined) return false;
      return groups.some((g) => {
        if (g.parentRowId !== rowId) return false;
        const openStart = openSessions[g.id];
        const ranges = [
          ...(closedSessions[g.id] ?? []),
          ...(openStart !== undefined
            ? [{ start: openStart, end: Infinity }]
            : []),
        ];
        return ranges.some((r) => r.start < barEnd && r.end > startSec);
      });
    },
    [
      punchRowIds,
      employeeOpenSessions,
      employeeClosedSessions,
      groups,
      openSessions,
      closedSessions,
    ],
  );

  // Break bars can't be deleted or edited yet, nor an employee's bar with a
  // customer under it (the trash greys out for both).
  const canDeleteSessionHere = useCallback(
    (rowId: number, startSec: number) =>
      !breakPunchRowIds.has(rowId) && !hasCustomerUnder(rowId, startSec),
    [breakPunchRowIds, hasCustomerUnder],
  );

  // Delete on a line with no bar picked (e.g. Unattended, whose block is its
  // customers'): with customers under the marker, say they go first.
  const deleteLineHere = useCallback(
    (lineId: number, sec: number) => {
      const hasCustomerHere = groups.some((g) => {
        if (g.parentRowId !== lineId) return false;
        const openStart = openSessions[g.id];
        if (openStart !== undefined && sec >= openStart) return true;
        return (closedSessions[g.id] ?? []).some(
          (r) => sec >= r.start && sec <= r.end,
        );
      });
      if (hasCustomerHere)
        setNotice({ rowId: lineId, text: CUSTOMER_UNDER_NOTICE, key: Date.now() });
    },
    [groups, openSessions, closedSessions],
  );

  // Returns false when refused, so the bar stays selected.
  const deleteSessionHere = useCallback(
    (rowId: number, startSec: number) => {
      if (breakPunchRowIds.has(rowId)) return false;
      if (hasCustomerUnder(rowId, startSec)) {
        setNotice({ rowId, text: CUSTOMER_UNDER_NOTICE, key: Date.now() });
        return false;
      }
      const punchRowId = punchRowIds.get(rowId);
      if (punchRowId === undefined) deleteSession(rowId, startSec);
      else employeeControls?.deleteSession(punchRowId, startSec);
      return true;
    },
    [
      breakPunchRowIds,
      hasCustomerUnder,
      punchRowIds,
      deleteSession,
      employeeControls,
    ],
  );
  const updateSessionHere = useCallback(
    (rowId: number, oldStart: number, next: { start: number; end?: number }) => {
      if (breakPunchRowIds.has(rowId)) return;
      const punchRowId = punchRowIds.get(rowId);
      if (punchRowId === undefined) updateSession(rowId, oldStart, next);
      else employeeControls?.updateSession(punchRowId, oldStart, next);
    },
    [breakPunchRowIds, punchRowIds, updateSession, employeeControls],
  );

  // One undo/redo across both histories, in the order the changes were made:
  // undo the most recent change, redo the one undone last.
  const employeeUndoAt = employeeControls?.lastUndoAt;
  const employeeRedoAt = employeeControls?.lastRedoAt;
  const undoHere = useCallback((): number | void => {
    if (
      employeeUndoAt !== undefined &&
      (lastUndoAt === undefined || employeeUndoAt > lastUndoAt)
    )
      return employeeControls?.undo();
    return undo();
  }, [employeeUndoAt, lastUndoAt, employeeControls, undo]);
  const redoHere = useCallback((): number | void => {
    if (
      employeeRedoAt !== undefined &&
      (lastRedoAt === undefined || employeeRedoAt < lastRedoAt)
    )
      return employeeControls?.redo();
    return redo();
  }, [employeeRedoAt, lastRedoAt, employeeControls, redo]);

  const employeesCustomersTimelineProps = useMemo(
    (): TimelineTabProps => ({
      headerLabel: "Employees & Customers",
      viewMode: "camera",
      rowsLoadState: false,
      // "+" (header or key), and "i" (except on a punched-out employee), add
      // an employee.
      showAddButton: onAddEmployee !== undefined,
      onAddRow: onAddEmployee,
      rowTracks: employeesCustomersTracks,
      // Back Room is 0, Unattended 1, then the employees (and digit keys).
      rowNumberStart: 0,
      // B / S send an employee to the Back Room and back, with their hints.
      onRowKey: handleRowKey,
      getOpenHint,
      canReassignRow,
      getSelectedHint,
      getParentHint,
      focusRow: employeesCustomersFocusRow,
      activeSessionStarts: employeesCustomersOpen,
      completedSessions: employeesCustomersClosed,
      onPunchIn: handleOpenPunchHere,
      onPunchOut: punchOutHere,
      onDeleteSession: deleteSessionHere,
      canDeleteSession: canDeleteSessionHere,
      onDeleteLine: deleteLineHere,
      onUpdateSession: updateSessionHere,
      getSessionBounds,
      onUndo: undoHere,
      onRedo: redoHere,
      canUndo: canUndo || employeeUndoAt !== undefined,
      canRedo: canRedo || employeeRedoAt !== undefined,
      reassignOptions: reassignOptionsAtMarker,
      onReassignRow: handleChangeParent,
      sessionWallSec,
      sessionFloorSec,
      // Until there's anybody: no employees and no customers.
      emptyGridMessage:
        !hasEmployees && groups.length === 0
          ? EMPLOYEES_CUSTOMERS_EMPTY_GRID_MESSAGE
          : undefined,
      rowNotice: wallNotice ?? notice,
    }),
    [
      onAddEmployee,
      employeesCustomersTracks,
      employeesCustomersOpen,
      employeesCustomersClosed,
      handleOpenPunchHere,
      punchOutHere,
      deleteSessionHere,
      canDeleteSessionHere,
      deleteLineHere,
      updateSessionHere,
      getSessionBounds,
      undoHere,
      redoHere,
      canUndo,
      canRedo,
      employeeUndoAt,
      employeeRedoAt,
      reassignOptionsAtMarker,
      handleChangeParent,
      sessionWallSec,
      sessionFloorSec,
      hasEmployees,
      groups.length,
      wallNotice,
      handleRowKey,
      getOpenHint,
      canReassignRow,
      getSelectedHint,
      getParentHint,
      employeesCustomersFocusRow,
      notice,
    ],
  );

  const punchDialogProps: ComponentProps<typeof CustomerPunchDialog> = {
    open: punchTarget !== null && !isReEnterOpen,
    onClose: handleClosePunch,
    countOptions: CUSTOMER_COUNT_OPTIONS,
    selectedCount: punchCount,
    onCountChange: setPunchCount,
    onPunchIn: handleConfirmPunch,
    onSelectReEnter: handleOpenReEnter,
    reEnterCustomer,
    onClearReEnter: () => setReEnterNumber(null),
  };

  const reEnterDialogProps: ComponentProps<typeof CustomerReEnterDialog> = {
    open: isReEnterOpen,
    onClose: handleCloseReEnter,
    customers: reEnterCustomers,
    selectedNumber: reEnterPickNumber,
    onSelectCustomer: setReEnterPickNumber,
    cameraCount: EMPLOYEE_DIALOG_CAMERA_SLOTS,
    selectedCamera: reEnterCamera,
    onSelectCamera: setReEnterCamera,
    previewSrc: assetUrl("camera/Cam thumbnail.svg"),
    onConfirm: handleConfirmReEnter,
  };

  return {
    employeesCustomersTimelineProps,
    punchDialogProps,
    reEnterDialogProps,
  };
};

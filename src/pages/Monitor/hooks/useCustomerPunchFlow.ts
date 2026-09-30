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
  CUSTOMERS_EMPTY_GRID_MESSAGE,
  CUSTOMER_EMPLOYEE_ROW_ID_BASE,
  UNATTENDED_ROW_ID,
  type TimelineTabProps,
} from "../constants";
import { useCustomerPunches } from "./useCustomerPunches";
import type { RowNotice } from "../../../components/timeline/rows/SessionRow";

type Range = { start: number; end: number };

const OUTSIDE_PUNCH_TIME_NOTICE =
  "Not possible: outside the employee's punch-in time";
const WALL_NOTICE = "Employee punched out here — punch out the customer first";

interface Params {
  /** Current marker: where attendance changes happen. */
  markerSec: number;
  // Employee punches state: who exists and when each one is punched in.
  employeeTracks: TimelineSnapshot["timeline"]["tracks"];
  employeeOpenSessions: Record<number, number>;
  employeeClosedSessions: Record<number, Range[]>;
  employeeRows: Record<number, number>;
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
    undo,
    redo,
    canUndo,
    canRedo,
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
      changeParent(groupRowId, parentRowId, markerSec);
    },
    [canAttendAt, changeParent, markerSec],
  );

  // Customer Punch in dialog: opened by "i" on a Customer punches row, for that
  // row at the marker.
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

  // Picking an employee moves the marker to their punch-in: the start of the
  // shift the marker is in, else of the latest one before it, else the first.
  // While any customer bar is still being built (open), the marker stays put,
  // so several customers can be tracked at once across employees.
  const rowSelectMarkerSec = useCallback(
    (rowId: number) => {
      if (Object.keys(openSessions).length > 0) return undefined;
      const punchRowId = punchRowIds.get(rowId);
      if (punchRowId === undefined) return undefined;
      const shifts = [...(employeeClosedSessions[punchRowId] ?? [])];
      const openStart = employeeOpenSessions[punchRowId];
      if (openStart !== undefined)
        shifts.push({ start: openStart, end: Infinity });
      if (shifts.length === 0) return undefined;
      shifts.sort((a, b) => a.start - b.start);
      const shift =
        shifts.find((s) => markerSec >= s.start && markerSec <= s.end) ??
        [...shifts].reverse().find((s) => s.start <= markerSec) ??
        shifts[0];
      return shift.start;
    },
    [
      openSessions,
      punchRowIds,
      employeeClosedSessions,
      employeeOpenSessions,
      markerSec,
    ],
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
    if (reEnterCustomer) {
      reEnter(reEnterCustomer.number, rowId, punchCount, sec);
    } else {
      addGroup(rowId, punchCount, sec);
    }
    handleClosePunch();
  }, [punchTarget, punchCount, reEnterCustomer, reEnter, addGroup, handleClosePunch]);

  const timelineProps = useMemo(
    (): TimelineTabProps => ({
      headerLabel: "Customer Punches",
      viewMode: "camera",
      // The list doesn't depend on review data, so no loader.
      rowsLoadState: false,
      rowTracks: tracks,
      activeSessionStarts: openSessions,
      completedSessions: closedSessions,
      // Starts on "Unattended" each time the tab is opened.
      focusRowId: UNATTENDED_ROW_ID,
      onPunchIn: handleOpenPunch,
      onPunchOut: punchOut,
      onDeleteSession: deleteSession,
      onUndo: undo,
      onRedo: redo,
      canUndo,
      canRedo,
      reassignOptions: reassignOptionsAtMarker,
      onReassignRow: handleChangeParent,
      sessionWallSec,
      emptyGridMessage:
        groups.length === 0 ? CUSTOMERS_EMPTY_GRID_MESSAGE : undefined,
      rowSelectMarkerSec,
      rowNotice: wallNotice ?? notice,
    }),
    [
      wallNotice,
      rowSelectMarkerSec,
      notice,
      tracks,
      openSessions,
      closedSessions,
      handleOpenPunch,
      punchOut,
      deleteSession,
      undo,
      redo,
      canUndo,
      canRedo,
      reassignOptionsAtMarker,
      handleChangeParent,
      sessionWallSec,
      groups.length,
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

  return { timelineProps, punchDialogProps, reEnterDialogProps };
};

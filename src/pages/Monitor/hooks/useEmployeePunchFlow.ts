import { useCallback, useMemo, useState, type ComponentProps } from "react";
import type EmployeePunchDialog from "../../../components/timeline/EmployeePunchDialog";
import {
  EMPLOYEE_DIALOG_CAMERA_SLOTS,
  EMPLOYEE_DIALOG_TABS,
  MOCK_DIALOG_EMPLOYEES,
  type EmployeeDialogTab,
} from "../../../components/timeline/constants";
import { assetUrl } from "../../../utils";
import { useEmployeePunches } from "./useEmployeePunches";

interface Params {
  /** Where punches from the add-employee dialog start (the current marker). */
  markerSec: number;
}

// Employees for the Employee and Customer tab: their rows and session bars
// (with undo/redo), the add-employee dialog, and the controls the tab uses.
export const useEmployeePunchFlow = ({ markerSec }: Params) => {
  const {
    tracks,
    openSessions,
    closedSessions,
    employeeRows,
    focused,
    addUnknownEmployee,
    addEmployee,
    punchIn,
    punchOut,
    deleteSession,
    updateSession,
    undo,
    redo,
    lastUndoAt,
    lastRedoAt,
    breakOpen,
    breakClosed,
    startBreak,
    finishBreak,
  } = useEmployeePunches();

  // Add-employee dialog (opened from the "+" in the list or the "+" key).
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState<EmployeeDialogTab>("all");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null,
  );
  const [camera, setCamera] = useState(0);

  const dialogEmployees = useMemo(
    () =>
      dialogTab === "all"
        ? MOCK_DIALOG_EMPLOYEES
        : MOCK_DIALOG_EMPLOYEES.filter((e) => e.type === dialogTab),
    [dialogTab],
  );

  const openDialog = useCallback(() => setIsDialogOpen(true), []);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    setDialogTab("all");
    setSelectedEmployeeId(null);
    setCamera(0);
  }, []);

  // Switching tabs clears the selection so a hidden employee can't be punched in.
  const changeDialogTab = useCallback((tab: EmployeeDialogTab) => {
    setDialogTab(tab);
    setSelectedEmployeeId(null);
  }, []);

  // Adds an "Unknown NNN" row and opens its session at the marker.
  const punchInUnknown = useCallback(() => {
    addUnknownEmployee(markerSec);
    closeDialog();
  }, [addUnknownEmployee, markerSec, closeDialog]);

  // Same for the employee picked in the dialog: their own row, reused if they
  // were already punched in before.
  const punchInSelected = useCallback(() => {
    const employee = MOCK_DIALOG_EMPLOYEES.find(
      (e) => e.id === selectedEmployeeId,
    );
    if (!employee) return;
    addEmployee(employee, markerSec);
    closeDialog();
  }, [selectedEmployeeId, addEmployee, markerSec, closeDialog]);

  // What Employee and Customer needs to act on employee bars and share the
  // undo/redo history.
  const controls = useMemo(
    () => ({
      punchIn,
      punchOut,
      deleteSession,
      updateSession,
      undo,
      redo,
      lastUndoAt,
      lastRedoAt,
      breakOpen,
      breakClosed,
      startBreak,
      finishBreak,
      // The row just added (e.g. from Employee and Customer), to select it.
      focused,
    }),
    [
      punchIn,
      punchOut,
      deleteSession,
      updateSession,
      undo,
      redo,
      lastUndoAt,
      lastRedoAt,
      breakOpen,
      breakClosed,
      startBreak,
      finishBreak,
      focused,
    ],
  );

  const dialogProps: ComponentProps<typeof EmployeePunchDialog> = {
    open: isDialogOpen,
    onClose: closeDialog,
    tabs: EMPLOYEE_DIALOG_TABS,
    selectedTab: dialogTab,
    onTabChange: changeDialogTab,
    employees: dialogEmployees,
    selectedEmployeeId,
    onSelectEmployee: setSelectedEmployeeId,
    cameraCount: EMPLOYEE_DIALOG_CAMERA_SLOTS,
    selectedCamera: camera,
    onSelectCamera: setCamera,
    previewSrc: assetUrl("camera/Cam thumbnail.svg"),
    onPunchInUnknown: punchInUnknown,
    onPunchInSelected: punchInSelected,
  };

  return {
    // What Customer punches needs to know about employees.
    tracks,
    openSessions,
    closedSessions,
    employeeRows,
    // Opens the add-employee dialog (also used by Employee and Customer).
    openDialog,
    controls,
    dialogProps,
  };
};

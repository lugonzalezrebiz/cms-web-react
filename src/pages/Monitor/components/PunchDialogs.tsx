import EmployeePunchDialog from "../../../components/timeline/EmployeePunchDialog";
import CustomerPunchDialog from "../../../components/timeline/CustomerPunchDialog";
import CustomerReEnterDialog from "../../../components/timeline/CustomerReEnterDialog";
import type { useMonitorTimeline } from "../hooks/useMonitorTimeline";

// Employees & Customers' punch-in dialogs, the same in both windows.
export const PunchDialogs = ({
  employee,
  customer,
  reEnter,
}: ReturnType<typeof useMonitorTimeline>["punchDialogProps"]) => (
  <>
    <EmployeePunchDialog {...employee} />
    <CustomerPunchDialog {...customer} />
    <CustomerReEnterDialog {...reEnter} />
  </>
);

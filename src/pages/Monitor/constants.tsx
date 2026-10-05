import type { ComponentProps } from "react";
import type TimeLine from "../../components/TimeLine";
import { Colors } from "../../theme";
import { HintKey } from "../../components/timeline/rows/SessionRow";

/** TimeLine props a timeline tab (Employees & Customers) sets on top of the
 * Compliance violations defaults. */
export type TimelineTabProps = Partial<ComponentProps<typeof TimeLine>>;

// Employees & Customers row ids. Each employee keeps the same id whether or
// not they punched in, so customer groups under them stay attached. Unknown
// employees reuse their Employee punches row id (small negatives); these sit
// far below.
export const UNATTENDED_ROW_ID = -100_000;
export const CUSTOMER_EMPLOYEE_ROW_ID_BASE = -100_000;
// Employee and Customer tab's "Back Room" line: between the employee ids
// (just below -100_000) and the customer groups (-200_000 and down).
export const BACK_ROOM_ROW_ID = -150_000;
// An employee's break line under Back Room: this base plus their Employee
// punches row id (a small negative), so it's below the customer groups'.
export const BACK_ROOM_BREAK_ROW_ID_BASE = -300_000;

export const EMPLOYEES_CUSTOMERS_EMPTY_GRID_MESSAGE = (
  <>
    Press the "<span style={{ color: Colors.vividOrange }}>i</span>" key on
    your keyboard to punch-in the first employee.
  </>
);

// Employee and Customer: next to the marker on an employee at work / on a
// break in the Back Room.
export const EMPLOYEE_AT_WORK_HINT = (
  <>
    Press <HintKey>B</HintKey> to move to the Back Room,{" "}
    <HintKey>C</HintKey> to assign customer or <HintKey>O</HintKey> to
    punch-out
  </>
);
export const EMPLOYEE_ON_BREAK_HINT = (
  <>
    Press <HintKey>S</HintKey> to move to the Show Room
  </>
);
// Next to the marker while "Unattended" is the selected line.
export const UNATTENDED_SELECTED_HINT = (
  <>
    Press <HintKey>i</HintKey> to Punch-in a customer
  </>
);

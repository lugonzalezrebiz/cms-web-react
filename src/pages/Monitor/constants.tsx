import type { ComponentProps } from "react";
import type TimeLine from "../../components/TimeLine";
import { Colors, Fonts } from "../../theme";
import { assetUrl } from "../../utils";

/** TimeLine props a timeline tab (Employee/Customer punches) sets on top of the
 * Compliance violations defaults. */
export type TimelineTabProps = Partial<ComponentProps<typeof TimeLine>>;

// Customer punches row ids. Each employee keeps the same id whether or not they
// punched in, so customer groups under them stay attached. Unknown employees
// reuse their Employee punches row id (small negatives); these sit far below.
export const UNATTENDED_ROW_ID = -100_000;
export const CUSTOMER_EMPLOYEE_ROW_ID_BASE = -100_000;
// Employee and Customer tab's "Back Room" line: between the employee ids
// (just below -100_000) and the customer groups (-200_000 and down).
export const BACK_ROOM_ROW_ID = -150_000;

export const EMPLOYEES_EMPTY_MESSAGE = (
  <span
    style={{
      fontFamily: Fonts.main,
      fontWeight: 400,
      fontSize: 12,
      lineHeight: "18px",
      letterSpacing: 0,
      textAlign: "center",
      color: Colors.dimGray,
      whiteSpace: "normal",
    }}
  >
    Press{" "}
    <img
      src={assetUrl("plus-1.svg")}
      alt="+"
      style={{ width: 12, height: 12, verticalAlign: "middle" }}
    />{" "}
    on your keyboard to add a new employee
  </span>
);

export const CUSTOMERS_EMPTY_GRID_MESSAGE = (
  <>
    Press the "<span style={{ color: Colors.vividOrange }}>i</span>" key on
    your keyboard to punch-in the customer with the employee who attended them.
  </>
);

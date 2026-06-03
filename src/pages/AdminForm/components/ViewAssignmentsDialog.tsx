import { useRef, useState } from "react";
import usePopover from "../../../hooks/usePopover";
import { Box } from "@mui/system";
import FormDialog from "../../../components/FormDialog";
import Table, { type Column } from "../../../components/Table";
import { CustomScrollbarY } from "../../../components/CustomScrollbar";
import useAssignments from "../../../hooks/useAssignments";
import useDissociateAssignment from "../hooks/useDissociateAssignment";
import { Colors, Fonts } from "../../../theme";
import AssignmentsDetailPopover, {
  type AssignmentDetail,
} from "./AssignmentsDetailPopover";

interface Props {
  open: boolean;
  onClose: () => void;
  employeeId?: number;
}

interface GroupedAssignment {
  companyDisplay: string;
  locationDisplay: string;
  companyID: number;
  locationID: number;
  details: AssignmentDetail[];
}

const ViewAssignmentsDialog = ({ open, onClose, employeeId }: Props) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const popover = usePopover();
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const { assignments, isLoading } = useAssignments({
    mode: "user",
    userID: employeeId ?? null,
  });

  const { dissociate, isPending, errorMessage } =
    useDissociateAssignment(employeeId);

  const grouped = assignments.reduce<Record<string, GroupedAssignment>>(
    (acc, a) => {
      const key = `${a.location}-${a.store}`;
      if (!acc[key]) {
        acc[key] = {
          companyDisplay: a.companyName
            ? `${a.companyName} (${a.location})`
            : String(a.location),
          locationDisplay: a.locationName
            ? `${a.locationName} (${a.store})`
            : String(a.store),
          companyID: a.location,
          locationID: a.store,
          details: [],
        };
      }
      acc[key].details.push({ date: a.date, state: a.state });
      return acc;
    },
    {},
  );

  const groupedList = Object.values(grouped);

  const columns: Column[] = [
    {
      title: "COMPANY",
      key: "company",
      width: "90px",
      align: "center",
      rowColor: Colors.vividOrange,
    },
    {
      title: "LOCATION",
      key: "location",
      width: "60px",
      align: "center",
    },
    {
      title: "",
      key: "detail",
      width: "60px",
      align: "center",
      rowColor: Colors.vividOrange,
      render: (value: { key: string; details: AssignmentDetail[] }) => (
        <>
          <Box
            onClick={(e: React.MouseEvent<HTMLElement>) => {
              popover.handleOpen(e);
              setActiveKey(value.key);
            }}
            sx={{
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {value.details.length}{" "}
            {value.details.length === 1 ? "assignment" : "assignments"}
            <img src="./assets/chevron-down-2.svg" alt="Expand" />
          </Box>
          <AssignmentsDetailPopover
            open={popover.open && activeKey === value.key}
            anchorEl={popover.anchorEl}
            onClose={() => {
              popover.handleClose();
              setActiveKey(null);
            }}
            details={value.details}
          />
        </>
      ),
    },
    {
      title: "",
      key: "delete",
      width: "40px",
      align: "center",
      render: (value: { locationID: number; companyID: number }) => (
        <Box
          component="img"
          src="./assets/trash-03.svg"
          alt="delete"
          sx={{
            cursor: isPending ? "not-allowed" : "pointer",
            display: "block",
            opacity: isPending ? 0.4 : 1,
          }}
          onClick={() =>
            !isPending && dissociate(value.companyID, value.locationID)
          }
        />
      ),
    },
  ];

  const rows = groupedList.map((g) => ({
    company: g.companyDisplay,
    location: g.locationDisplay,
    detail: { key: `${g.companyID}-${g.locationID}`, details: g.details },
    delete: { locationID: g.locationID, companyID: g.companyID },
  }));

  return (
    <FormDialog
      title="Assignment"
      open={open}
      onClose={onClose}
      gap="12px"
      maxWidth="450px"
    >
      {!isLoading && rows.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "120px",
            color: Colors.dimGray,
            fontFamily: Fonts.main,
            fontSize: "14px",
          }}
        >
          No assignments found for this employee
        </Box>
      ) : (
        <CustomScrollbarY
          ref={scrollContainerRef}
          height="320px"
          thumbLength={15}
          scrollX
          xThumbLength={15}
          sx={{ width: "100%" }}
        >
          <Box p="0px 0px 12px 0px">
            <Table
              columns={columns}
              rows={rows}
              mainColumnWidth="120px"
              mainRowWidth="120px"
              TableCellWidth="120px"
              rowWidth="120px"
              scrollContainerRef={scrollContainerRef}
              disableOverflow
              loading={isLoading}
            />
            {errorMessage && (
              <Box
                sx={{
                  mt: "8px",
                  px: "8px",
                  color: Colors.red,
                  fontFamily: Fonts.main,
                  fontSize: "12px",
                }}
              >
                {errorMessage}
              </Box>
            )}
          </Box>
        </CustomScrollbarY>
      )}
    </FormDialog>
  );
};

export default ViewAssignmentsDialog;

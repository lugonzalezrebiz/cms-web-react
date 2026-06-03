import { useRef } from "react";
import { Box } from "@mui/system";
import FormDialog from "../../../components/FormDialog";
import Table, { type Column } from "../../../components/Table";
import { CustomScrollbarY } from "../../../components/CustomScrollbar";
import useAssignments from "../../../hooks/useAssignments";
import useDissociateAssignment from "../hooks/useDissociateAssignment";
import { Colors, Fonts } from "../../../theme";
import StateBadge from "../../../components/StateBadge";
import type { stateAssignments } from "../../../components/stateColors";

interface Props {
  open: boolean;
  onClose: () => void;
  employeeId?: number;
}

const ViewAssignmentsDialog = ({ open, onClose, employeeId }: Props) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { assignments, isLoading } = useAssignments({
    mode: "user",
    userID: employeeId ?? null,
  });

  const { dissociate, isPending, errorMessage } =
    useDissociateAssignment(employeeId);

  const columns: Column[] = [
    {
      title: "COMPANY",
      key: "company",
      width: "80px",
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
      title: "STATUS",
      key: "state",
      width: "60px",
      align: "center",
      render: (value: stateAssignments) => <StateBadge state={value} />,
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

  const rows = assignments.map((a) => ({
    company: a.companyName
      ? `${a.companyName} (${a.location})`
      : String(a.location),
    location: a.locationName
      ? `${a.locationName} (${a.store})`
      : String(a.store),
    state: a.state,
    delete: { locationID: a.store, companyID: a.location },
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

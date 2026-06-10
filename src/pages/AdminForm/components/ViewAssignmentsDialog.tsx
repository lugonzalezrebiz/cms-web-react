import { useRef, useState } from "react";
import { Box } from "@mui/system";
import Drawer from "../../../components/Drawer";
import Divider from "../../../components/Divider";
import Table, { type Column } from "../../../components/Table";
import { CustomScrollbarY } from "../../../components/CustomScrollbar";
import useUserAssignments, {
  type AssignmentDetail,
} from "../../../hooks/useUserAssignments";
import useDissociateAssignment from "../hooks/useDissociateAssignment";
import useResetPassword from "../hooks/useResetPassword";
import { Colors, Fonts } from "../../../theme";
import StateBadge from "../../../components/StateBadge";
import styled from "@emotion/styled";
import ResetPasswordDialog from "./ResetPasswordDialog";

interface Props {
  open: boolean;
  onClose: () => void;
  employeeId?: number;
  name?: string;
  role?: string;
}

const Title = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "20px",
  fontWeight: 600,
  color: Colors.charcoalNavy,
  height: "30px",
  lineHeight: 1.5,
});

const EmployeeDrawerHeader = ({
  name,
  role,
  onResetPassword,
}: {
  name?: string;
  role?: string;
  onResetPassword?: () => void;
}) => {
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          p: "8px 0 8px 16px",
        }}
      >
        <Box p={"4px 8px 4px 0"}>
          <img
            src="./assets/user-03.svg"
            alt="user"
            style={{
              width: 34,
              height: 34,
              marginTop: "4px",
              marginLeft: "-4px",
            }}
          />
        </Box>
        <Box>
          <Box
            sx={{
              fontFamily: Fonts.main,
              fontSize: "16px",
              fontWeight: 600,
              color: Colors.lightBlack,
              lineHeight: 1.5,
            }}
          >
            {name}
          </Box>
          <Box
            sx={{
              fontFamily: Fonts.main,
              fontSize: "14px",
              fontWeight: 500,
              color: Colors.dimGray,
              display: "flex",
              alignItems: "center",
              gap: "4px",
              lineHeight: 1.43,
            }}
          >
            {role} Agent -
            <Box
              component="span"
              onClick={onResetPassword}
              sx={{
                color: Colors.vividOrange,
                fontWeight: 500,
                cursor: "pointer",
                textDecoration: "underline",
                lineHeight: 1.43,
              }}
            >
              Reset Password
            </Box>
          </Box>
        </Box>
      </Box>
      <Divider marginBottom="0px" />
    </Box>
  );
};

const AssignmentToggle = ({
  details,
  activeKey,
  rowKey,
  onToggle,
}: {
  details: AssignmentDetail[];
  activeKey: string | null;
  rowKey: string;
  onToggle: (key: string) => void;
}) => {
  const hasDetails = details.length > 0;
  return (
    <Box
      onClick={() => hasDetails && onToggle(rowKey)}
      sx={{
        cursor: hasDetails ? "pointer" : "default",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      {details.length} {details.length === 1 ? "assignment" : "assignments"}
      {hasDetails && (
        <img
          src="./assets/chevron-down-2.svg"
          alt="Expand"
          style={{
            transform: activeKey === rowKey ? "rotate(180deg)" : "none",
            transition: "transform 0.2s ease",
          }}
        />
      )}
    </Box>
  );
};

const DeleteButton = ({
  companyID,
  locationID,
  pendingKey,
  onDelete,
}: {
  companyID: number;
  locationID: number;
  pendingKey: string | null;
  onDelete: (companyID: number, locationID: number) => void;
}) => {
  const isPending = pendingKey === `${companyID}-${locationID}`;
  return (
    <Box
      component="img"
      src="./assets/trash-03.svg"
      alt="delete"
      sx={{
        cursor: isPending ? "not-allowed" : "pointer",
        display: "block",
        opacity: isPending ? 0.4 : 1,
      }}
      onClick={() => !isPending && onDelete(companyID, locationID)}
    />
  );
};

const ExpandedDetails = ({
  details,
  isExpanded,
}: {
  details: AssignmentDetail[];
  isExpanded: boolean;
}) => {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateRows: isExpanded ? "1fr" : "0fr",
        transition: "grid-template-rows 0.25s ease",
      }}
    >
      <Box sx={{ overflow: "hidden" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            padding: "8px 6px",
            borderBottom: `1px solid ${Colors.paleGray}`,
            gap: "1px",
          }}
        >
          {details.map((item, i) => (
            <Box
              key={i}
              sx={{
                display: "flex",
                alignItems: "center",
                borderBottom:
                  i < details.length - (details.length % 2 === 0 ? 2 : 1)
                    ? `1px solid ${Colors.paleGray}`
                    : "none",
                padding: "6px 16px",
                gap: "8px",
              }}
            >
              <Box
                sx={{
                  fontFamily: Fonts.main,
                  fontSize: "14px",
                  color: Colors.lightBlack,
                  whiteSpace: "nowrap",
                  flex: 1,
                }}
              >
                {item.date}
              </Box>
              <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <StateBadge state={item.state} size="md" />
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

const ViewAssignmentsDialog = ({
  open,
  onClose,
  employeeId,
  name,
  role,
}: Props) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);

  const { groupedList, isLoading } = useUserAssignments({
    userID: employeeId ?? null,
    dateFormat: "short",
  });

  const {
    resetPassword,
    isPending: resetPending,
    errorMessage: resetError,
  } = useResetPassword(employeeId);

  const { dissociate, pendingKey, errorMessage } =
    useDissociateAssignment(employeeId);

  const columns: Column[] = [
    {
      title: "COMPANY",
      key: "company",
      width: "70px",
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
      align: "left",
      rowColor: Colors.vividOrange,
      render: (value: { key: string; details: AssignmentDetail[] }) => (
        <AssignmentToggle
          details={value.details}
          activeKey={activeKey}
          rowKey={value.key}
          onToggle={(key) =>
            setActiveKey((prev) => (prev === key ? null : key))
          }
        />
      ),
    },
    {
      title: "",
      key: "delete",
      width: "15px",
      align: "right",
      render: (value: { locationID: number; companyID: number }) => (
        <DeleteButton
          companyID={value.companyID}
          locationID={value.locationID}
          pendingKey={pendingKey}
          onDelete={dissociate}
        />
      ),
    },
  ];

  const rows = groupedList.map((g) => {
    const key = `${g.companyID}-${g.locationID}`;
    const isExpanded = activeKey === key;
    return {
      company: g.companyDisplay,
      location: g.locationDisplay,
      detail: { key, details: g.details },
      delete: { locationID: g.locationID, companyID: g.companyID },
      content: <ExpandedDetails details={g.details} isExpanded={isExpanded} />,
    };
  });

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        header={
          <EmployeeDrawerHeader
            name={name}
            role={role}
            onResetPassword={() => setResetPasswordOpen(true)}
          />
        }
      >
        <Box mt="20px" display="flex" flexDirection="column" height="99%">
          <Box mb="4px" pl="16px">
            <Title>Assignments</Title>
          </Box>
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
              height="95%"
              thumbLength={15}
              scrollX
              xThumbLength={15}
              sx={{ width: "100%", height: "100%" }}
            >
              <Box height={"100%"}>
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
        </Box>
      </Drawer>

      <ResetPasswordDialog
        open={resetPasswordOpen}
        onClose={() => setResetPasswordOpen(false)}
        onSubmit={resetPassword}
        isPending={resetPending}
        errorMessage={resetError}
      />
    </>
  );
};

export default ViewAssignmentsDialog;

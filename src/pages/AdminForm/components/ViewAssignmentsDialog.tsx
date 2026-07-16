import { useRef, useState } from "react";
import { Box } from "@mui/system";
import styled from "@emotion/styled";
import Drawer from "../../../components/Drawer";
import Table, { type Column } from "../../../components/Table";
import { CustomScrollbarY } from "../../../components/CustomScrollbar";
import StateBadge from "../../../components/StateBadge";
import type { stateAssignments } from "../../../components/stateColors";
import useUserAssignments, {
  type AssignmentDetail,
} from "../../../hooks/useUserAssignments";
import useDissociateAssignment from "../hooks/useDissociateAssignment";
import useResetPassword from "../hooks/useResetPassword";
import useApprovedLocations from "../hooks/useApprovedLocations";
import useDeactivateApprovedLocation from "../hooks/useDeactivateApprovedLocation";
import useIncidents from "../hooks/useIncidents";
import useToggleUserActive from "../hooks/useToggleUserActive";
import { Colors, Fonts } from "../../../theme";
import ConfirmDialog from "../../../components/ConfirmDialog";
import ResetPasswordDialog from "./ResetPasswordDialog";
import EmployeeDrawerHeader from "./ViewAssignmentsDialog/EmployeeDrawerHeader";
import AssignmentToggle from "./ViewAssignmentsDialog/AssignmentToggle";
import DetailToggle from "./ViewAssignmentsDialog/DetailToggle";
import DeleteButton from "./ViewAssignmentsDialog/DeleteButton";
import ExpandedDetails from "./ViewAssignmentsDialog/ExpandedDetails";
import ExpandedLocationDetails from "./ViewAssignmentsDialog/ExpandedLocationDetails";
import ExpandedIncidentDetails from "./ViewAssignmentsDialog/ExpandedIncidentDetails";
import { formatEnumLabel } from "./ViewAssignmentsDialog/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  employeeId?: number;
  name?: string;
  role?: string;
  active?: boolean;
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

const ViewAssignmentsDialog = ({
  open,
  onClose,
  employeeId,
  name,
  role,
  active,
}: Props) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [locationActiveKey, setLocationActiveKey] = useState<string | null>(
    null,
  );
  const [incidentActiveKey, setIncidentActiveKey] = useState<string | null>(
    null,
  );
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [localActive, setLocalActive] = useState(active);
  const [syncedEmployeeId, setSyncedEmployeeId] = useState(employeeId);
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);

  if (employeeId !== syncedEmployeeId) {
    setSyncedEmployeeId(employeeId);
    setLocalActive(active);
    setConfirmToggleOpen(false);
  }

  const {
    toggleActive,
    isPending: togglingActive,
    errorMessage: toggleActiveError,
  } = useToggleUserActive(employeeId);

  const confirmToggleActive = () => {
    if (localActive === undefined || togglingActive) return;
    const next = !localActive;
    toggleActive(next, () => {
      setLocalActive(next);
      setConfirmToggleOpen(false);
    });
  };

  const { groupedList, isLoading } = useUserAssignments({
    userID: employeeId ?? null,
    dateFormat: "short",
  });

  const { locations: approvedLocations, isLoading: locationsLoading } =
    useApprovedLocations(employeeId);

  const {
    deactivate: deactivateLocation,
    pendingKey: locationPendingKey,
    errorMessage: deactivateLocationError,
  } = useDeactivateApprovedLocation(employeeId);

  const { incidents, isLoading: incidentsLoading } = useIncidents(employeeId);

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
      title: "STORE",
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

  const locationColumns: Column[] = [
    {
      title: "# PHONE",
      key: "phoneNumber",
      width: "70px",
      align: "center",
      rowColor: Colors.vividOrange,
    },
    {
      title: "ADDRESS LINE 1",
      key: "addressLine1",
      width: "60px",
      align: "center",
    },
    {
      title: "COUNTRY",
      key: "country",
      width: "50px",
      align: "center",
    },
    {
      title: "CITY/REGION",
      key: "cityRegion",
      width: "50px",
      align: "center",
    },
    {
      title: "",
      key: "detail",
      width: "40px",
      align: "left",
      rowColor: Colors.vividOrange,
      render: (value: { key: string }) => (
        <DetailToggle
          activeKey={locationActiveKey}
          rowKey={value.key}
          onToggle={(key) =>
            setLocationActiveKey((prev) => (prev === key ? null : key))
          }
        />
      ),
    },
    {
      title: "",
      key: "delete",
      width: "15px",
      align: "right",
      render: (value: { id: number }) => (
        <DeleteButton
          companyID={value.id}
          locationID={value.id}
          pendingKey={locationPendingKey}
          onDelete={(id) => deactivateLocation(id)}
        />
      ),
    },
  ];

  const locationRows = approvedLocations.map((location) => {
    const key = String(location.id);
    const isExpanded = locationActiveKey === key;
    return {
      phoneNumber: location.phone,
      addressLine1: location.addressLine1,
      country: location.country,
      cityRegion: location.city,
      detail: { key },
      delete: { id: location.id },
      content: (
        <ExpandedLocationDetails location={location} isExpanded={isExpanded} />
      ),
    };
  });

  const incidentColumns: Column[] = [
    {
      title: "TYPE",
      key: "type",
      width: "80px",
      align: "center",
      rowColor: Colors.vividOrange,
    },
    {
      title: "REASON",
      key: "reason",
      width: "80px",
      align: "center",
    },
    {
      title: "SEVERITY",
      key: "severity",
      width: "25px",
      align: "center",
      render: (value: stateAssignments) => (
        <StateBadge state={value} size="sm" />
      ),
    },
    {
      title: "",
      key: "detail",
      width: "20px",
      align: "left",
      rowColor: Colors.vividOrange,
      render: (value: { key: string }) => (
        <DetailToggle
          activeKey={incidentActiveKey}
          rowKey={value.key}
          onToggle={(key) =>
            setIncidentActiveKey((prev) => (prev === key ? null : key))
          }
        />
      ),
    },
  ];

  const incidentRows = incidents.map((incident) => {
    const key = String(incident.id);
    const isExpanded = incidentActiveKey === key;
    return {
      type: formatEnumLabel(incident.incidentType),
      reason: formatEnumLabel(incident.incidentReason),
      severity: incident.severity,
      detail: { key },
      content: (
        <ExpandedIncidentDetails incident={incident} isExpanded={isExpanded} />
      ),
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
            active={localActive}
            onResetPassword={() => setResetPasswordOpen(true)}
            onToggleActive={() => setConfirmToggleOpen(true)}
            toggleActiveError={toggleActiveError}
          />
        }
      >
        <Box mt="20px" display="flex" flexDirection="column" height="30%">
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
              maxHeight="95%"
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
        <Box mt="24px" display="flex" flexDirection="column" height="30%">
          <Box mb="4px" pl="16px">
            <Title>Locations</Title>
          </Box>
          {!locationsLoading && locationRows.length === 0 ? (
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
              No locations found for this employee
            </Box>
          ) : (
            <CustomScrollbarY
              ref={scrollContainerRef}
              maxHeight="95%"
              thumbLength={15}
              scrollX
              xThumbLength={15}
              sx={{ width: "100%", height: "100%" }}
            >
              <Box height={"100%"}>
                <Table
                  columns={locationColumns}
                  rows={locationRows}
                  mainColumnWidth="120px"
                  mainRowWidth="120px"
                  TableCellWidth="120px"
                  rowWidth="120px"
                  scrollContainerRef={scrollContainerRef}
                  disableOverflow
                  loading={locationsLoading}
                />
                {deactivateLocationError && (
                  <Box
                    sx={{
                      mt: "8px",
                      px: "8px",
                      color: Colors.red,
                      fontFamily: Fonts.main,
                      fontSize: "12px",
                    }}
                  >
                    {deactivateLocationError}
                  </Box>
                )}
              </Box>
            </CustomScrollbarY>
          )}
        </Box>
        <Box mt="24px" display="flex" flexDirection="column" height="30%">
          <Box mb="4px" pl="16px">
            <Title>Incidents</Title>
          </Box>
          {!incidentsLoading && incidentRows.length === 0 ? (
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
              No incidents found for this employee
            </Box>
          ) : (
            <CustomScrollbarY
              ref={scrollContainerRef}
              maxHeight="95%"
              thumbLength={15}
              scrollX
              xThumbLength={15}
              sx={{ width: "100%", height: "100%" }}
            >
              <Box height={"100%"}>
                <Table
                  columns={incidentColumns}
                  rows={incidentRows}
                  mainColumnWidth="120px"
                  mainRowWidth="120px"
                  TableCellWidth="120px"
                  rowWidth="120px"
                  scrollContainerRef={scrollContainerRef}
                  disableOverflow
                  loading={incidentsLoading}
                />
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

      <ConfirmDialog
        open={confirmToggleOpen}
        onClose={() => setConfirmToggleOpen(false)}
        onConfirm={confirmToggleActive}
        isPending={togglingActive}
        confirmLabel={localActive ? "Yes" : "Yes"}
        cancelLabel="No"
        message={
          localActive
            ? `Disable ${name ? `${name}'s` : "this"} account? They'll lose access to the monitoring system immediately, until you re-enable it.`
            : `Enable ${name ? `${name}'s` : "this"} account? They'll regain access to the monitoring system immediately.`
        }
      />
    </>
  );
};

export default ViewAssignmentsDialog;

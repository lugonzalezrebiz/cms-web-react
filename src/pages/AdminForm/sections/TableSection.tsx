import { useMemo, useRef, useState } from "react";
import { Colors } from "../../../theme";
import { Box, Grid } from "@mui/system";
import Title from "../../../components/Title";
import TickBox from "../../../components/TickBox";
import Button from "../../../components/Button";
import Table, { type Column } from "../../../components/Table";
import { CustomScrollbarY } from "../../../components/CustomScrollbar";
import CreateEmployeeDialog from "../components/CreateEmployeeDialog";
import AssignDialog from "../components/AssignDialog";
import ViewAssignmentsDialog from "../components/ViewAssignmentsDialog";
import { ADMIN_ROLE, AGENT_ROLE, REVIEWER_ROLE } from "../../../config";
import useUsers, { type User } from "../hooks/useUsers";
import StateBadge from "../../../components/StateBadge";

const TableSection = () => {
  const { users, isLoading } = useUsers();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<
    | {
        id: number;
        name: string;
        role: string;
      }
    | undefined
  >(undefined);

  const allSelected = users.length > 0 && selectedIds.size === users.length;

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(users.map((u: User) => u.id)) : new Set());
  };

  const toggleOne = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleRowClick = (id: number) => {
    const user = users.find((u: User) => u.id === id);
    if (user) {
      const role =
        user.roleID === ADMIN_ROLE
          ? "Admin"
          : user.roleID === AGENT_ROLE
            ? "Agent"
            : user.roleID === REVIEWER_ROLE
              ? "Reviewer"
              : String(user.roleID);
      setSelectedEmployee({ id: user.id, name: user.name, role });
      setViewDialogOpen(true);
    }
  };

  const columns: Column[] = [
    {
      title: "",
      key: "selected",
      width: "48px",
      align: "right",
      complement: (
        <Box width="70px" display="flex" justifyContent="center">
          <TickBox
            label=""
            checked={allSelected}
            onChange={(e) => toggleAll(e.target.checked)}
          />
        </Box>
      ),
      render: (value: { id: number; checked: boolean }) => (
        <Box width="70px" display="flex" justifyContent="center">
          <TickBox
            label=""
            checked={value.checked}
            onChange={(e) => toggleOne(value.id, e.target.checked)}
          />
        </Box>
      ),
    },
    {
      title: "USER ID",
      key: "id",
      width: "50px",
      align: "left",
    },
    {
      title: "USERNAME",
      key: "username",
      rowColor: Colors.vividOrange,
      width: "80px",
    },
    { title: "ROL", key: "role" },
    { title: "NAME", key: "name", rowColor: Colors.vividOrange },
    { title: "E-MAIL", key: "email", width: "150px" },
    {
      title: "ACTIVE",
      key: "active",
      width: "70px",
      align: "center",
      render: (value: string) => (
        <StateBadge
          size="md"
          label={value}
          sx={{
            bgcolor: value === "Yes" ? Colors.mintFoam : Colors.palePink,
            color: value === "Yes" ? Colors.leafGreen : Colors.blushRed,
            border: `1px solid ${value === "Yes" ? Colors.leafGreen : Colors.blushRed}`,
          }}
        />
      ),
    },
    {
      title: "",
      key: "assign",
      width: "46px",
      align: "left",
      render: (value: number) => (
        <Box display="flex" justifyContent="center" width="70px">
          <Button
            square
            sx={{ height: "20px" }}
            fontSize="12px"
            outfit
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEmployee({ id: value, name: "", role: "" });
              setAssignDialogOpen(true);
            }}
          >
            ASSIGN
          </Button>
        </Box>
      ),
    },
  ];

  const rows = useMemo(
    () =>
      users.map((user: User) => ({
        selected: { id: user.id, checked: selectedIds.has(user.id) },
        id: user.id,
        username: user.username,
        role:
          user.roleID === ADMIN_ROLE
            ? "Admin"
            : user.roleID === AGENT_ROLE
              ? "Agent"
              : user.roleID === REVIEWER_ROLE
                ? "Reviewer"
                : String(user.roleID),
        name: user.name,
        email: user.email,
        active: user.active ? "Yes" : "No",
        assign: user.id,
      })),
    [users, selectedIds],
  );

  return (
    <Box
      sx={{
        overflow: "hidden",
        gap: "26px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Title
        margin={false}
        showDivider={false}
        title="Users"
        marginBottom="16px"
      >
        <Grid
          container
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Button
            outfit
            onClick={() => setCreateDialogOpen(true)}
            fontSize="14px"
          >
            <Box sx={{ display: "flex", alignItems: "center" }} mr={"4px"}>
              <img src="./assets/plus.svg" alt="" />
            </Box>
            <span>Create a New Employee</span>
          </Button>
        </Grid>
      </Title>
      <CustomScrollbarY
        ref={scrollContainerRef}
        maxHeight="580px"
        sx={{ width: "100%", bgcolor: Colors.white, borderRadius: "8px" }}
        bottom={0}
        top={45}
        thumbLength={15}
        scrollX
        xThumbLength={15}
      >
        <Table
          columns={columns}
          rows={rows}
          loading={isLoading}
          mainColumnWidth="50px"
          mainRowWidth="50px"
          TableCellWidth="150px"
          rowWidth="150px"
          scrollContainerRef={scrollContainerRef}
          disableOverflow
          clickableRows="allRow"
          onRowClick={handleRowClick}
        />
      </CustomScrollbarY>
      <CreateEmployeeDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
      <AssignDialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        employeeId={selectedEmployee?.id}
      />
      <ViewAssignmentsDialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        employeeId={selectedEmployee?.id}
        name={selectedEmployee?.name}
        role={selectedEmployee?.role}
      />
    </Box>
  );
};

export default TableSection;

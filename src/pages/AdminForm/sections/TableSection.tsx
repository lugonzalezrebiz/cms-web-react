import { useMemo, useState } from "react";
import { Colors, Fonts } from "../../../theme";
import { Box, Grid } from "@mui/system";
import Title from "../../../components/Title";
import TickBox from "../../../components/TickBox";
import Button from "../../../components/Button";
import Table, { type Column } from "../../../components/Table";
import CreateEmployeeDialog from "../components/CreateEmployeeDialog";
import { ADMIN_ROLE, AGENT_ROLE, REVIEWER_ROLE } from "../../../config";
import useUsers, { type User } from "../hooks/useUsers";

const TableSection = () => {
  const { users, isLoading } = useUsers();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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

  const columns: Column[] = [
    {
      title: "",
      key: "selected",
      width: "36px",
      align: "center",
      complement: (
        <TickBox
          label=""
          checked={allSelected}
          onChange={(e) => toggleAll(e.target.checked)}
        />
      ),
      render: (value: { id: number; checked: boolean }) => (
        <TickBox
          label=""
          checked={value.checked}
          onChange={(e) => toggleOne(value.id, e.target.checked)}
        />
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
    { title: "E-MAIL", key: "email", width: "220px" },
    {
      title: "ACTIVE",
      key: "active",
      // width: "80px",
      render: (value: string) => (
        <Box
          sx={{
            display: "inline-block",
            px: "10px",
            py: "2px",
            borderRadius: "6px",
            backgroundColor: value === "Yes" ? Colors.green : Colors.red,
            color: Colors.white,
            fontSize: "12px",
            fontFamily: Fonts.main,
            fontWeight: 600,
          }}
        >
          {value}
        </Box>
      ),
    },
    {
      title: "",
      key: "assign",
      // width: "80px",
      render: () => (
        <Button square sx={{ height: "20px" }} fontSize="12px" outfit>
          ASSIGN
        </Button>
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
        assign: null,
      })),
    [users, selectedIds],
  );

  return (
    <>
      <Title margin={false} title="Users" marginBottom="0">
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
      <Box width={"100%"}>
        <Table
          columns={columns}
          rows={rows}
          loading={isLoading}
          mainColumnWidth="50px"
          mainRowWidth="50px"
          TableCellWidth="150px"
          rowWidth="150px"
        />
      </Box>
      <CreateEmployeeDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </>
  );
};

export default TableSection;

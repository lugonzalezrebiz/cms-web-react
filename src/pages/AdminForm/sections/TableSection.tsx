import { useMemo, useState } from "react";
import { Colors, Fonts } from "../../../theme";
import { Box, Grid } from "@mui/system";
import SelectComponent from "../../../components/SelectComponent";
import Title from "../../../components/Title";
import TickBox from "../../../components/TickBox";
import Button from "../../../components/Button";
import Table, { type Column } from "../../../components/Table";
import CreateEmployeeDialog from "../components/CreateEmployeeDialog";
import { ADMIN_ROLE, AGENT_ROLE, REVIEWER_ROLE } from "../../../config";
import useUsers, { type User } from "../hooks/useUsers";
import {
  companiesFilters,
  storesFilters,
  agentsFilters,
  reviewsFilters,
  workloadFilters,
  statusFilters,
} from "../mocks";

const sizeSelect = "119px";
const padding = "2px 4px";
const fontSize = "12px";

const TableSection = () => {
  const [showOnlyUnassigned, setShowOnlyUnassigned] = useState(false);
  const { users, isLoading } = useUsers();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [company, setCompany] = useState("all");
  const [store, setStore] = useState("all");
  const [agent, setAgent] = useState("all");
  const [review, setReview] = useState("all");
  const [workload, setWorkload] = useState("all");
  const [status, setStatus] = useState("all");
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
      width: "40px",
      align: "right",
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
      title: "User ID",
      key: "id",
      width: "80px",
      align: "left",
    },
    {
      title: "Username",
      key: "username",
      rowColor: Colors.vividOrange,
      width: "80px",
    },
    { title: "Rol", key: "role" },
    { title: "Name", key: "name", rowColor: Colors.vividOrange },
    { title: "E-mail", key: "email", width: "220px" },
    {
      title: "Active",
      key: "active",
      // width: "80px",
      render: (value: string) => (
        <Box
          sx={{
            display: "inline-block",
            px: "10px",
            py: "2px",
            borderRadius: "12px",
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
      <Title title="Users">
        <Grid
          container
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <TickBox
            label="Show only Unassigned"
            checked={showOnlyUnassigned}
            onChange={(e) => setShowOnlyUnassigned(e.target.checked)}
          />
          <SelectComponent
            filters={companiesFilters}
            filter={company}
            setFilter={setCompany}
            size={sizeSelect}
            padding={padding}
            fontSize={fontSize}
          />
          <SelectComponent
            filters={storesFilters}
            filter={store}
            setFilter={setStore}
            size={sizeSelect}
            padding={padding}
            fontSize={fontSize}
          />
          <SelectComponent
            filters={agentsFilters}
            filter={agent}
            setFilter={setAgent}
            size={sizeSelect}
            padding={padding}
            fontSize={fontSize}
          />
          <SelectComponent
            filters={reviewsFilters}
            filter={review}
            setFilter={setReview}
            size={sizeSelect}
            padding={padding}
            fontSize={fontSize}
          />
          <SelectComponent
            filters={workloadFilters}
            filter={workload}
            setFilter={setWorkload}
            size={sizeSelect}
            padding={padding}
            fontSize={fontSize}
          />
          <SelectComponent
            filters={statusFilters}
            filter={status}
            setFilter={setStatus}
            size={sizeSelect}
            padding={padding}
            fontSize={fontSize}
          />
          <Button
            sx={{ ml: "6px" }}
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
      <Table
        columns={columns}
        rows={rows}
        loading={isLoading}
        mainColumnWidth="50px"
        mainRowWidth="50px"
        TableCellWidth="150px"
        rowWidth="150px"
      />
      <CreateEmployeeDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </>
  );
};

export default TableSection;

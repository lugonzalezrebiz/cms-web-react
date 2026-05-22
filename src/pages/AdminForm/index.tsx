import { useState } from "react";
import { Box, Grid } from "@mui/system";
import HeaderCard from "./components/Card";
import SelectComponent from "../../components/SelectComponent";
import Title from "../../components/Title";
import TickBox from "../../components/TickBox";
import Button from "../../components/Button";

const cards = [
  { title: "Unassigned", current: 9 },
  {
    title: "Paused Assignments",
    current: 1,
  },
  {
    title: "Rejected Assignments",
    current: 1,
  },
  { title: "Open Tickets", current: 1 },
  { title: "Unassigned", current: 9 },
];

const activityIcon = "/assets/activity-other-icon.svg";

const companiesFilters = [
  { label: "All Companies", value: "all" },
  { label: "Company A", value: "company_a" },
  { label: "Company B", value: "company_b" },
];

const storesFilters = [
  { label: "All Stores", value: "all" },
  { label: "Store A", value: "store_a" },
  { label: "Store B", value: "store_b" },
];

const agentsFilters = [
  { label: "All Agents", value: "all" },
  { label: "Agent A", value: "agent_a" },
  { label: "Agent B", value: "agent_b" },
];

const reviewsFilters = [
  { label: "All Reviews", value: "all" },
  { label: "Review A", value: "review_a" },
  { label: "Review B", value: "review_b" },
];

const workloadFilters = [
  { label: "All Workload", value: "all" },
  { label: "Low", value: "low" },
  { label: "High", value: "high" },
];

const statusFilters = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const AdminForm = () => {
  const [showOnlyUnassigned, setShowOnlyUnassigned] = useState(false);
  const [company, setCompany] = useState("all");
  const [store, setStore] = useState("all");
  const [agent, setAgent] = useState("all");
  const [review, setReview] = useState("all");
  const [workload, setWorkload] = useState("all");
  const [status, setStatus] = useState("all");
  const sizeSelect = "103px";
  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <Grid container spacing={2}>
        {cards.map((card) => (
          <Grid key={card.title} size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
            <HeaderCard
              title={card.title}
              current={card.current}
              image={activityIcon}
            />
          </Grid>
        ))}
      </Grid>
      <Title title="Locations">
        <Grid
          container
          sx={{
            //justifyContent: { xs: "center", sm: "flex-start" },
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
            padding="2px 4px"
          />
          <SelectComponent
            filters={storesFilters}
            filter={store}
            setFilter={setStore}
            size={sizeSelect}
          />
          <SelectComponent
            filters={agentsFilters}
            filter={agent}
            setFilter={setAgent}
            size={sizeSelect}
          />
          <SelectComponent
            filters={reviewsFilters}
            filter={review}
            setFilter={setReview}
            size={sizeSelect}
          />
          <SelectComponent
            filters={workloadFilters}
            filter={workload}
            setFilter={setWorkload}
            size={sizeSelect}
          />
          <SelectComponent
            filters={statusFilters}
            filter={status}
            setFilter={setStatus}
            size={sizeSelect}
          />
          <Button outfit>
            <Box sx={{ display: "flex", alignItems: "center" }} mr={"4px"}>
              <img src="./assets/plus.svg" alt="" />
            </Box>
            <span>Create a New Employee</span>
          </Button>
        </Grid>
      </Title>
    </Box>
  );
};

export default AdminForm;

import { useState } from "react";
import useNavigateWithQuery from "../../hooks/useNavigate";
import { Box, Grid } from "@mui/system";
import HeaderCard, { NewAssignmentsCard } from "./components/Card";
import Title from "../../components/Title";
import SelectComponent from "../../components/SelectComponent";
import { REVIEWER_REDIRECT } from "../Login/sections/hooks/useLogin";

const activityIcon = "/assets/activity-other-icon.svg";

const cards = [
  { title: "New Assignments", current: 6 },
  { title: "Paused Assignments", current: 2 },
  { title: "Rejected Assignments", current: 3 },
  { title: "Open Tickets", current: 2 },
  { title: "Completed This Month", current: 34 },
];

const assignments = [
  {
    state: "Paused" as const,
    location: 162,
    store: 6015,
    date: "February 24 - 2026",
    comments: 0,
  },
  {
    state: "Paused" as const,
    location: 205,
    store: 9274,
    date: "February 25 - 2026",
    comments: 0,
  },
  {
    state: "Resolved" as const,
    location: 187,
    store: 4829,
    date: "February 25 - 2026",
    comments: 0,
  },
  {
    state: "New" as const,
    location: 250,
    store: 8537,
    date: "February 25 - 2026",
    comments: 0,
  },
  {
    state: "New" as const,
    location: 205,
    store: 2958,
    date: "February 25 - 2026",
    comments: 0,
  },
  {
    state: "New" as const,
    location: 205,
    store: 6392,
    date: "February 25 - 2026",
    comments: 0,
  },
  {
    state: "New" as const,
    location: 162,
    store: 1047,
    date: "February 25 - 2026",
    comments: 0,
  },
  {
    state: "New" as const,
    location: 205,
    store: 7359,
    date: "February 25 - 2026",
    comments: 0,
  },
];

const rejectedAssignments = [
  {
    state: "Rejected" as const,
    location: 205,
    store: 6392,
    date: "February 25 - 2026",
    comments: 0,
  },
  {
    state: "Rejected" as const,
    location: 162,
    store: 9274,
    date: "February 25 - 2026",
    comments: 0,
  },
  {
    state: "Rejected" as const,
    location: 205,
    store: 1047,
    date: "February 25 - 2026",
    comments: 0,
  },
];

const Monitor = () => {
  const navigate = useNavigateWithQuery();
  const [company, setCompany] = useState("");
  const [store, setStore] = useState("");

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

      <Title title="New Assignments">
        <Box mr={"20px"}>
          <SelectComponent
            filters={[{ label: "All Companies", value: "" }]}
            filter={company}
            setFilter={setCompany}
          />
        </Box>
        <SelectComponent
          filters={[{ label: "All Stores", value: "" }]}
          filter={store}
          setFilter={setStore}
        />
      </Title>
      <Grid container spacing={2}>
        {assignments.map((a, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
            <NewAssignmentsCard {...a} onClick={() => navigate(REVIEWER_REDIRECT)} />
          </Grid>
        ))}
      </Grid>
      <Title title="Rejected Assignments"></Title>
      <Grid container spacing={2}>
        {rejectedAssignments.map((a, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
            <NewAssignmentsCard {...a} onClick={() => navigate(REVIEWER_REDIRECT)} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Monitor;

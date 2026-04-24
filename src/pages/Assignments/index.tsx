import { useState } from "react";
import useNavigateWithQuery from "../../hooks/useNavigate";
import { Box, Grid } from "@mui/system";
import HeaderCard, { NewAssignmentsCard } from "./components/Card";
import Title from "../../components/Title";
import SelectComponent from "../../components/SelectComponent";
import { usePopover } from "../../components/timeline/hooks/usePopover";
import DropDownMenu from "../../components/DropDownMenu";
import type { Assignment } from "./components/InfoAssignment";
import InfoAssignment from "./components/InfoAssignment";

const REVIEWER_REDIRECT = "/monitor?company=9001&location=222&date=20260407";
const activityIcon = "/assets/activity-other-icon.svg";

const dropdownOptions = (onOpen: () => void) => [
  { label: "See detail information", onClick: onOpen },
];

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
    items: [
      { activity: "Date", complement: "Mar 19, 2025" },
      {
        activity: "Open",
        complement: "09:00 (MST)",
      },
      {
        activity: "Close",
        complement: "19:00 (MST)",
      },
      {
        activity: "Open at",
        complement: "08:00",
      },
      {
        activity: "DVR",
        complement: "08:00",
      },
      {
        activity: "Diff",
        complement: "0",
      },
      {
        activity: "Interval",
        complement: "Events",
      },
    ],
    commentsTex: [
      "This comment is vey important, please be aware that the light whent out at 10:35 am untill 11:23 am",
      "Remember the key to our craft is to embrace lifelong learning and adapt to new challenges with unwavering enthusiasm.",
    ],
  },
  {
    state: "Paused" as const,
    location: 205,
    store: 9274,
    date: "February 25 - 2026",
    comments: 0,
    items: [
      { activity: "Date", complement: "Mar 19, 2025" },
      {
        activity: "Open",
        complement: "09:00 (MST)",
      },
      {
        activity: "Close",
        complement: "19:00 (MST)",
      },
      {
        activity: "Open at",
        complement: "08:00",
      },
      {
        activity: "DVR",
        complement: "08:00",
      },
      {
        activity: "Diff",
        complement: "0",
      },
      {
        activity: "Interval",
        complement: "Events",
      },
    ],
    commentsTex: [
      "This comment is vey important, please be aware that the light whent out at 10:35 am untill 11:23 am",
      "Remember the key to our craft is to embrace lifelong learning and adapt to new challenges with unwavering enthusiasm.",
    ],
  },
  {
    state: "Resolved" as const,
    location: 187,
    store: 4829,
    date: "February 25 - 2026",
    comments: 0,
    items: [
      { activity: "Date", complement: "Mar 19, 2025" },
      {
        activity: "Open",
        complement: "09:00 (MST)",
      },
      {
        activity: "Close",
        complement: "19:00 (MST)",
      },
      {
        activity: "Open at",
        complement: "08:00",
      },
      {
        activity: "DVR",
        complement: "08:00",
      },
      {
        activity: "Diff",
        complement: "0",
      },
      {
        activity: "Interval",
        complement: "Events",
      },
    ],
    commentsTex: [
      "This comment is vey important, please be aware that the light whent out at 10:35 am untill 11:23 am",
      "Remember the key to our craft is to embrace lifelong learning and adapt to new challenges with unwavering enthusiasm.",
    ],
  },
  {
    state: "New" as const,
    location: 250,
    store: 8537,
    date: "February 25 - 2026",
    comments: 0,
    items: [
      { activity: "Date", complement: "Mar 19, 2025" },
      {
        activity: "Open",
        complement: "09:00 (MST)",
      },
      {
        activity: "Close",
        complement: "19:00 (MST)",
      },
      {
        activity: "Open at",
        complement: "08:00",
      },
      {
        activity: "DVR",
        complement: "08:00",
      },
      {
        activity: "Diff",
        complement: "0",
      },
      {
        activity: "Interval",
        complement: "Events",
      },
    ],
    commentsTex: [
      "This comment is vey important, please be aware that the light whent out at 10:35 am untill 11:23 am",
      "Remember the key to our craft is to embrace lifelong learning and adapt to new challenges with unwavering enthusiasm.",
    ],
  },
  {
    state: "New" as const,
    location: 205,
    store: 2958,
    date: "February 25 - 2026",
    comments: 0,
    items: [
      { activity: "Date", complement: "Mar 19, 2025" },
      {
        activity: "Open",
        complement: "09:00 (MST)",
      },
      {
        activity: "Close",
        complement: "19:00 (MST)",
      },
      {
        activity: "Open at",
        complement: "08:00",
      },
      {
        activity: "DVR",
        complement: "08:00",
      },
      {
        activity: "Diff",
        complement: "0",
      },
      {
        activity: "Interval",
        complement: "Events",
      },
    ],
    commentsTex: [
      "This comment is vey important, please be aware that the light whent out at 10:35 am untill 11:23 am",
      "Remember the key to our craft is to embrace lifelong learning and adapt to new challenges with unwavering enthusiasm.",
    ],
  },
  {
    state: "New" as const,
    location: 205,
    store: 6392,
    date: "February 25 - 2026",
    comments: 0,
    items: [
      { activity: "Date", complement: "Mar 19, 2025" },
      {
        activity: "Open",
        complement: "09:00 (MST)",
      },
      {
        activity: "Close",
        complement: "19:00 (MST)",
      },
      {
        activity: "Open at",
        complement: "08:00",
      },
      {
        activity: "DVR",
        complement: "08:00",
      },
      {
        activity: "Diff",
        complement: "0",
      },
      {
        activity: "Interval",
        complement: "Events",
      },
    ],
    commentsTex: [
      "This comment is vey important, please be aware that the light whent out at 10:35 am untill 11:23 am",
      "Remember the key to our craft is to embrace lifelong learning and adapt to new challenges with unwavering enthusiasm.",
    ],
  },
  {
    state: "New" as const,
    location: 162,
    store: 1047,
    date: "February 25 - 2026",
    comments: 0,
    items: [
      { activity: "Date", complement: "Mar 19, 2025" },
      {
        activity: "Open",
        complement: "09:00 (MST)",
      },
      {
        activity: "Close",
        complement: "19:00 (MST)",
      },
      {
        activity: "Open at",
        complement: "08:00",
      },
      {
        activity: "DVR",
        complement: "08:00",
      },
      {
        activity: "Diff",
        complement: "0",
      },
      {
        activity: "Interval",
        complement: "Events",
      },
    ],
    commentsTex: [
      "This comment is vey important, please be aware that the light whent out at 10:35 am untill 11:23 am",
      "Remember the key to our craft is to embrace lifelong learning and adapt to new challenges with unwavering enthusiasm.",
    ],
  },
  {
    state: "New" as const,
    location: 205,
    store: 7359,
    date: "February 25 - 2026",
    comments: 0,
    items: [
      { activity: "Date", complement: "Mar 19, 2025" },
      {
        activity: "Open",
        complement: "09:00 (MST)",
      },
      {
        activity: "Close",
        complement: "19:00 (MST)",
      },
      {
        activity: "Open at",
        complement: "08:00",
      },
      {
        activity: "DVR",
        complement: "08:00",
      },
      {
        activity: "Diff",
        complement: "0",
      },
      {
        activity: "Interval",
        complement: "Events",
      },
    ],
    commentsTex: [
      "This comment is vey important, please be aware that the light whent out at 10:35 am untill 11:23 am",
      "Remember the key to our craft is to embrace lifelong learning and adapt to new challenges with unwavering enthusiasm.",
    ],
  },
];

const rejectedAssignments = [
  {
    state: "Rejected" as const,
    location: 205,
    store: 6392,
    date: "February 25 - 2026",
    comments: 0,
    items: [
      { activity: "Date", complement: "Mar 19, 2025" },
      {
        activity: "Open",
        complement: "09:00 (MST)",
      },
      {
        activity: "Close",
        complement: "19:00 (MST)",
      },
      {
        activity: "Open at",
        complement: "08:00",
      },
      {
        activity: "DVR",
        complement: "08:00",
      },
      {
        activity: "Diff",
        complement: "0",
      },
      {
        activity: "Interval",
        complement: "Events",
      },
    ],
    commentsTex: [
      "This comment is vey important, please be aware that the light whent out at 10:35 am untill 11:23 am",
      "Remember the key to our craft is to embrace lifelong learning and adapt to new challenges with unwavering enthusiasm.",
    ],
  },
  {
    state: "Rejected" as const,
    location: 162,
    store: 9274,
    date: "February 25 - 2026",
    comments: 0,
    items: [
      { activity: "Date", complement: "Mar 19, 2025" },
      {
        activity: "Open",
        complement: "09:00 (MST)",
      },
      {
        activity: "Close",
        complement: "19:00 (MST)",
      },
      {
        activity: "Open at",
        complement: "08:00",
      },
      {
        activity: "DVR",
        complement: "08:00",
      },
      {
        activity: "Diff",
        complement: "0",
      },
      {
        activity: "Interval",
        complement: "Events",
      },
    ],
    commentsTex: [
      "This comment is vey important, please be aware that the light whent out at 10:35 am untill 11:23 am",
      "Remember the key to our craft is to embrace lifelong learning and adapt to new challenges with unwavering enthusiasm.",
    ],
  },
  {
    state: "Rejected" as const,
    location: 205,
    store: 1047,
    date: "February 25 - 2026",
    comments: 0,
    items: [
      { activity: "Date", complement: "Mar 19, 2025" },
      {
        activity: "Open",
        complement: "09:00 (MST)",
      },
      {
        activity: "Close",
        complement: "19:00 (MST)",
      },
      {
        activity: "Open at",
        complement: "08:00",
      },
      {
        activity: "DVR",
        complement: "08:00",
      },
      {
        activity: "Diff",
        complement: "0",
      },
      {
        activity: "Interval",
        complement: "Events",
      },
    ],
    commentsTex: [
      "This comment is vey important, please be aware that the light whent out at 10:35 am untill 11:23 am",
      "Remember the key to our craft is to embrace lifelong learning and adapt to new challenges with unwavering enthusiasm.",
    ],
  },
];

const Monitor = () => {
  const navigate = useNavigateWithQuery();
  const [company, setCompany] = useState("");
  const [store, setStore] = useState("");
  const cardMenu = usePopover();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);

  const handleOpenDialog = () => {
    setDialogOpen(true);
    cardMenu.handleClose();
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

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
            <NewAssignmentsCard
              {...a}
              onClick={() => navigate(REVIEWER_REDIRECT)}
              openMenu={(e) => {
                setSelectedAssignment(a);
                cardMenu.handleOpen(e);
              }}
            />
          </Grid>
        ))}
      </Grid>
      <Title title="Rejected Assignments"></Title>
      <Grid container spacing={2}>
        {rejectedAssignments.map((a, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
            <NewAssignmentsCard
              {...a}
              onClick={() => navigate(REVIEWER_REDIRECT)}
              openMenu={(e) => {
                setSelectedAssignment(a);
                cardMenu.handleOpen(e);
              }}
            />
          </Grid>
        ))}
      </Grid>

      <DropDownMenu
        anchorEl={cardMenu.anchorEl}
        open={cardMenu.open}
        options={dropdownOptions(handleOpenDialog)}
        handleClose={cardMenu.handleClose}
      />

      <InfoAssignment
        handleCloseDialog={handleCloseDialog}
        dialogOpen={dialogOpen}
        selectedAssignment={selectedAssignment}
      />
    </Box>
  );
};

export default Monitor;

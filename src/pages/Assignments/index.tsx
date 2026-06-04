import { useState } from "react";
import { Box, Grid } from "@mui/system";
import { HeaderCard, NewAssignmentsCard } from "../../components/DashboardCards";
import CardSkeleton from "../../components/CardSkeleton";
import Title from "../../components/Title";
import SelectComponent from "../../components/SelectComponent";
import { usePopover } from "../../components/timeline/hooks/usePopover";
import DropDownMenu from "../../components/DropDownMenu";
import type { Assignment } from "./components/InfoAssignment";
import InfoAssignment from "./components/InfoAssignment";
import useCompanies from "../../hooks/useCompanies";
import useAssignments from "../../hooks/useAssignments";
import { useAssignmentNavigate } from "./hooks/useAssignmentNavigate";

const activityIcon = "./assets/activity-other-icon.svg";

const dropdownOptions = (onOpen: () => void) => [
  { label: "See detail information", onClick: onOpen },
];

const Assignments = () => {
  const { handleNavigate } = useAssignmentNavigate();
  const [company, setCompany] = useState("");
  const [store, setStore] = useState("");
  const { companyFilters, getStoreFilters } = useCompanies();
  const effectiveCompany = company || companyFilters[1]?.value || "";
  const { assignments, isPending: isLoading } = useAssignments({
    companyID: effectiveCompany ? Number(effectiveCompany) : null,
    locationID: store ? Number(store) : null,
  });

  const cards = [
    { title: "Assignments", current: assignments.length },
    {
      title: "Paused Assignments",
      current: assignments.filter((a) => a.state === "Paused").length,
    },
    {
      title: "Rejected Assignments",
      current: assignments.filter((a) => a.state === "Error").length,
    },
    { title: "Open Tickets", current: 0 },
    { title: "Completed This Month", current: 0 },
  ];

  const handleSetCompany = (value: string) => {
    setCompany(value);
    setStore("");
  };

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

      <Title title="Assignments">
        <Grid
          container
          sx={{
            justifyContent: { xs: "center", sm: "flex-start" },
          }}
        >
          <Box mr={{ xs: "0px", sm: "20px" }}>
            <SelectComponent
              filters={companyFilters}
              filter={effectiveCompany}
              setFilter={handleSetCompany}
            />
          </Box>
          <SelectComponent
            filters={getStoreFilters(effectiveCompany)}
            filter={store}
            setFilter={setStore}
          />
        </Grid>
      </Title>
      <Grid container spacing={2}>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
              <CardSkeleton variant="assignment" />
            </Grid>
          ))
        ) : assignments.filter((a) => a.state !== "Error").length === 0 ? (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
            <CardSkeleton variant="none" />
          </Grid>
        ) : (
          assignments
            .filter((a) => a.state !== "Error")
            .map((a, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
                <NewAssignmentsCard
                  {...a}
                  onClick={() => handleNavigate(a)}
                  openMenu={(e) => {
                    setSelectedAssignment(a);
                    cardMenu.handleOpen(e);
                  }}
                  isCompleted={a.statusName === "resource.review.completed"}
                />
              </Grid>
            ))
        )}
      </Grid>
      <Title title="Rejected Assignments"></Title>
      <Grid container spacing={2}>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
              <CardSkeleton variant="assignment" />
            </Grid>
          ))
        ) : assignments.filter((a) => a.state === "Error").length === 0 ? (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
            <CardSkeleton variant="none" />
          </Grid>
        ) : (
          assignments
            .filter((a) => a.state === "Error")
            .map((a, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
                <NewAssignmentsCard
                  {...a}
                  onClick={() => handleNavigate(a)}
                  openMenu={(e) => {
                    setSelectedAssignment(a);
                    cardMenu.handleOpen(e);
                  }}
                />
              </Grid>
            ))
        )}
      </Grid>

      {/* <Title title="Test" />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <NewAssignmentsCard
            state="Ready"
            location={9001}
            store={222}
            date="Monitor Test"
            comments={0}
            onClick={() => navigate("/monitor-test")}
          />
        </Grid>
      </Grid> */}

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

export default Assignments;

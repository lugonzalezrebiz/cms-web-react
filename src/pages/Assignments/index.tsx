import { useState } from "react";
import { Box, Grid } from "@mui/system";
import {
  HeaderCard,
  NewAssignmentsCard,
} from "../../components/DashboardCards";
import CardSkeleton from "../../components/CardSkeleton";
import Title from "../../components/Title";
import SelectComponent from "../../components/SelectComponent";
import { usePopover } from "../../components/timeline/hooks/usePopover";
import DropDownMenu from "../../components/DropDownMenu";
import type { Assignment } from "../../hooks/useAssignments";
import InfoAssignment from "./components/InfoAssignment";
import OpenTicketDialog from "./components/OpenTicketDialog";
import SuccessDialog from "../../components/SuccessDialog";
import useCompanies from "../../hooks/useCompanies";
import useAssignments from "../../hooks/useAssignments";
import { useAssignmentNavigate } from "./hooks/useAssignmentNavigate";
import { useAssignmentCount } from "../AdminForm/hooks/useAssignmentCount";
import Divider from "../../components/Divider";
import { CustomScrollbarY } from "../../components/CustomScrollbar";

const activityIcon = "./assets/activity-other-icon.svg";

const dropdownOptions = (onOpenTicket: () => void, onSeeDetail: () => void) => [
  { label: "Open a ticket", onClick: onOpenTicket },
  { label: "See detail information", onClick: onSeeDetail },
];

const Assignments = () => {
  const { handleNavigate } = useAssignmentNavigate();
  const [company, setCompany] = useState("");
  const [store, setStore] = useState("");
  const { companyFilters, getStoreFilters } = useCompanies();
  const effectiveCompany = company;
  const { assignments: rawAssignments, isPending: isLoading } = useAssignments({
    companyID: effectiveCompany ? Number(effectiveCompany) : 0,
    locationID: store ? Number(store) : null,
  });
  const assignments = rawAssignments.filter((a) => {
    if (effectiveCompany && a.location !== Number(effectiveCompany)) return false;
    if (store && a.store !== Number(store)) return false;
    return true;
  });
  const { cards, isLoading: isCardsLoading } = useAssignmentCount();

  const handleSetCompany = (value: string) => {
    setCompany(value);
    setStore("");
  };

  const cardMenu = usePopover();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [ticketSuccessOpen, setTicketSuccessOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);

  const handleOpenDialog = () => {
    setDialogOpen(true);
    cardMenu.handleClose();
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleOpenTicketDialog = () => {
    setTicketDialogOpen(true);
    cardMenu.handleClose();
  };

  const handleCloseTicketDialog = () => {
    setTicketDialogOpen(false);
  };

  return (
    <CustomScrollbarY thumbLength={15} bottom={2} maxHeight="100%">
      {(hasScroll) => (
      <Box sx={{ p: 2, pr: hasScroll ? 0 : 2, display: "flex", flexDirection: "column", gap: 2 }}>
        <Grid container spacing={2} mb={2}>
          {isCardsLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
                  <CardSkeleton variant="header" title={cards[i]?.title} />
                </Grid>
              ))
            : cards.map((card) => (
                <Grid key={card.title} size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
                  <HeaderCard
                    title={card.title}
                    current={card.current}
                    image={activityIcon}
                  />
                </Grid>
              ))}
        </Grid>

        <Title margin={false} title="Assignments">
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
        <Grid container spacing={2} mb={2}>
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
        <Title
          margin={false}
          showDivider={false}
          title="Rejected Assignments"
        />
        <Box mt={-1}>
          <Divider />
        </Box>
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

        <DropDownMenu
          anchorEl={cardMenu.anchorEl}
          open={cardMenu.open}
          options={dropdownOptions(handleOpenTicketDialog, handleOpenDialog)}
          handleClose={cardMenu.handleClose}
        />

        <InfoAssignment
          handleCloseDialog={handleCloseDialog}
          dialogOpen={dialogOpen}
          selectedAssignment={selectedAssignment}
        />

        {selectedAssignment && (
          <OpenTicketDialog
            open={ticketDialogOpen}
            onClose={handleCloseTicketDialog}
            onSuccess={() => setTicketSuccessOpen(true)}
            selectedAssignment={selectedAssignment}
          />
        )}

        <SuccessDialog
          open={ticketSuccessOpen}
          onClose={() => setTicketSuccessOpen(false)}
          message={
            <>
              The ticket has been created successfully.
              <br />
              As soon as it gets resolved the assignment would be back on your
              dashboard.
            </>
          }
        />
      </Box>
      )}
    </CustomScrollbarY>
  );
};

export default Assignments;

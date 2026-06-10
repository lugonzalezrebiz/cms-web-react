import { useState } from "react";
import { Box, Grid } from "@mui/system";
import { HeaderCard } from "../../components/DashboardCards";
import CardSkeleton from "../../components/CardSkeleton";
import TableSection from "./sections/TableSection";
import { CustomScrollbarY } from "../../components/CustomScrollbar";
import TicketsDrawer from "./components/TicketsDrawer";
import { useAssignmentCount } from "./hooks/useAssignmentCount";

const activityIcon = "./assets/activity-other-icon.svg";

const AdminForm = () => {
  const [ticketsOpen, setTicketsOpen] = useState(false);
  const { cards, isLoading } = useAssignmentCount();

  return (
    <CustomScrollbarY thumbLength={15} bottom={2} height="100%">
      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        <Grid container spacing={2}>
          {isLoading
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
                    onClick={
                      card.title === "Tickets"
                        ? () => setTicketsOpen(true)
                        : undefined
                    }
                  />
                </Grid>
              ))}
        </Grid>
        <TableSection />
      </Box>
      <TicketsDrawer open={ticketsOpen} onClose={() => setTicketsOpen(false)} />
    </CustomScrollbarY>
  );
};

export default AdminForm;

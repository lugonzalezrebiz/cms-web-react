import { Box, Grid } from "@mui/system";
import HeaderCard from "./components/Card";

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

const AdminForm = () => {
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
    </Box>
  );
};

export default AdminForm;

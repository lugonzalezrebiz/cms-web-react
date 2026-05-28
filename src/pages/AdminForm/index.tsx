import { Box, Grid } from "@mui/system";
import { HeaderCard } from "../../components/DashboardCards";
import TableSection from "./sections/TableSection";
import { CustomScrollbarY } from "../../components/CustomScrollbar";
import { cards } from "./mocks";

const activityIcon = "./assets/activity-other-icon.svg";

const AdminForm = () => {
  return (
    <CustomScrollbarY thumbLength={15} bottom={2} height="100%">
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
        <TableSection />
      </Box>
    </CustomScrollbarY>
  );
};

export default AdminForm;

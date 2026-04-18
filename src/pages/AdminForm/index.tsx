import { useState } from "react";
import { Box, Grid } from "@mui/system";
import Form from "./sections/Form";
import TableSection from "./sections/TableSection";
import { Colors, Fonts } from "../../theme";

const AdminForm = () => {
  const [rows, setRows] = useState<Record<string, string>[]>([]);

  const handleAddRow = (row: Record<string, string>) => {
    setRows((prev) => [...prev, row]);
  };

  return (
    <Box mt={"2%"}>
      {/* <Box
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        <p
          style={{
            color: Colors.vividOrange,
            fontWeight: 700,
            fontSize: "22px",
            fontFamily: Fonts.main,
            margin: 0,
          }}
        >
          Admin Form
        </p>
      </Box> */}
      <Grid container spacing={2} mt={"25px"}>
        <Grid size={6}>
          <Form onAddRow={handleAddRow} />
        </Grid>
        <Grid size={6}>
          <Box
            sx={{
              height: "474px",
              bgcolor: Colors.white,
              borderRadius: "8px",
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
              maxWidth: "600px",
              padding: "0 0 0 20px",
              ml: "16px",
              overflow: "scroll",
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            <TableSection rows={rows} />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminForm;

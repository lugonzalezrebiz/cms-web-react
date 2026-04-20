import { useState } from "react";
import { Box, Grid } from "@mui/system";
import Form from "./sections/Form";
import TableSection from "./sections/TableSection";
import { Colors } from "../../theme";
import type { Column } from "../../components/Table";
const columns: Column[] = [
  { title: "User", key: "user" },
  { title: "Location", key: "location" },
  { title: "Company", key: "company" },
  { title: "Date", key: "date" },
];

const AdminForm = () => {
  const [rows, setRows] = useState<Record<string, string>[]>([]);

  const handleAddRow = (row: Record<string, string>) => {
    setRows((prev) => [...prev, row]);
  };

  return (
    <Box mt={"2%"}>
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
            <TableSection rows={rows} columns={columns} />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminForm;

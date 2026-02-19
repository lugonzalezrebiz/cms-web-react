import { useState } from "react";
import AppDialogComponent from "./components/AppDialogComponent";
import { Box, Grid } from "@mui/system";

function App() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const toggleDialog = () => setIsDialogOpen((prev) => !prev);
  return (
    <Grid>
      <Box>
        <AppDialogComponent
          accentColor="#ff6000"
          title="Dialog Title"
          description="This is a description of the dialog. It provides more details about the content and purpose of the dialog."
          open={isDialogOpen}
          onClose={toggleDialog}
        >
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec vel
            sapien eget nunc efficitur commodo. Sed at ligula a enim efficitur
            tincidunt. Curabitur ac odio id metus efficitur convallis. Nulla
            facilisi. Donec ut nunc sed enim efficitur fermentum. Proin in felis
            a nisl efficitur bibendum. Maecenas ac mi sed enim efficitur
            convallis.
          </p>
        </AppDialogComponent>
      </Box>
      <button onClick={toggleDialog}>Toggle Dialog</button>
    </Grid>
  );
}

export default App;

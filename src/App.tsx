import { useState } from "react";
import { Box, Grid } from "@mui/system";
import AppDialogComponent from "./components/AppDialogComponent";
import { GlobalStyles } from "./GlobalStyles";
import { useColorScheme } from "./hooks/useColorScheme";
import type { ColorScheme } from "./hooks/useColorScheme";

const schemes: ColorScheme[] = ["light", "dark", "system"];

function App() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const toggleDialog = () => setIsDialogOpen((prev) => !prev);
  const { preference, setPreference } = useColorScheme();

  return (
    <Grid>
      <GlobalStyles />
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
      <Box>
        {schemes.map((scheme) => (
          <button
            key={scheme}
            onClick={() => setPreference(scheme)}
            disabled={preference === scheme}
          >
            {scheme}
          </button>
        ))}
      </Box>
    </Grid>
  );
}

export default App;

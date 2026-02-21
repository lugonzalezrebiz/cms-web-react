import { useState } from "react";
import { ThemeProvider } from "@emotion/react";
import { Box } from "@mui/system";
import AppDialog from "./components/AppDialog";
import { theme } from "./theme";
import { useColorScheme } from "./hooks/useColorScheme";
import type { ColorScheme } from "./hooks/useColorScheme";
import "./css/global.css";

const schemes: ColorScheme[] = ["light", "dark", "system"];

function App() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const toggleDialog = () => setIsDialogOpen((prev) => !prev);
  const { preference, setPreference } = useColorScheme();

  return (
    <ThemeProvider theme={theme}>
    <div>
      <Box>
        <AppDialog
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
        </AppDialog>
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
    </div>
    </ThemeProvider>
  );
}

export default App;

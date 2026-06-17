import { useState } from "react";
import { Box } from "@mui/system";
import { Colors, Fonts } from "../../theme";
import { CustomScrollbarY } from "../../components/CustomScrollbar";
import FormDialog from "../../components/FormDialog";
import TickBox from "../../components/TickBox";
import Button from "../../components/Button";
import useTrackerCameraMap from "../../hooks/useTrackerCameraMap";

interface GroupItem {
  value: string;
  title: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCustomCreate?: (ids: string[]) => void;
  groups: GroupItem[];
  monitoringID: string;
}

const CustomTrackerDialog = ({
  open,
  onClose,
  onCustomCreate,
  groups,
  monitoringID,
}: Props) => {
  const storageKey = `custom_tracker_group_${monitoringID}`;
  const [selected, setSelected] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });
  const trackerCameraMap = useTrackerCameraMap(monitoringID);

  const anchorId = selected[0];
  const anchorCameras = anchorId
    ? trackerCameraMap.get(Number(anchorId))
    : null;

  const isEnabled = (value: string) => {
    if (!anchorCameras) return true;
    if (value === anchorId) return true;
    const cams = trackerCameraMap.get(Number(value));
    if (!cams) return false;
    for (const cam of cams) {
      if (anchorCameras.has(cam)) return true;
    }
    return false;
  };

  const handleToggle = (val: string) => {
    if (!isEnabled(val)) return;
    setSelected((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val],
    );
  };

  const handleClose = () => {
    setSelected([]);
    onClose();
  };

  const handleCreate = () => {
    sessionStorage.setItem(storageKey, JSON.stringify(selected));
    onCustomCreate?.(selected);
    new BroadcastChannel("timeline-sync").postMessage({ type: "custom-group", ids: selected.map(Number) });
    onClose();
  };

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      title="Custom Tracker Grouping"
      maxWidth="471px"
    >
      <Box
        sx={{
          fontFamily: Fonts.secondary,
          fontSize: "14px",
          color: Colors.charcoalNavy,
          fontWeight: 500,
          lineHeight: 1.43,
        }}
      >
        You can only group trackers that share the same cameras
      </Box>

      <CustomScrollbarY height="160px" sx={{ mt: "16px", mb: "40px" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            width: "100%",
          }}
        >
          {groups.map((g) => {
            const enabled = isEnabled(g.value);
            return (
              <Box
                key={g.value}
                sx={{ display: "flex", alignItems: "center", width: "100%" }}
              >
                <TickBox
                  label={g.title}
                  value={g.value}
                  checked={selected.includes(g.value)}
                  disabled={!enabled}
                  onChange={() => handleToggle(g.value)}
                />
              </Box>
            );
          })}
        </Box>
      </CustomScrollbarY>

      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box
          sx={{
            display: "flex",
            fontFamily: Fonts.buttonFont,
            fontSize: "14px",
            color: Colors.vividOrange,
            justifyContent: "flex-start",
            cursor: "pointer",
            fontWeight: 600,
            lineHeight: 1.43,
          }}
          onClick={() => setSelected([])}
        >
          Unselect all
        </Box>
        <Box display="flex" gap={1} justifyContent="flex-end">
          <Button color="secondary" fontSize="14px" onClick={handleClose}>
            Cancel
          </Button>
          <Button fontSize="14px" disabled={selected.length < 2} onClick={handleCreate}>
            Create Custom Tracker Group
          </Button>
        </Box>
      </Box>
    </FormDialog>
  );
};

export default CustomTrackerDialog;

import { useState, useMemo } from "react";
import { Box } from "@mui/system";
import { Colors, Fonts } from "../../theme";
import { CustomScrollbarY } from "../../components/CustomScrollbar";
import FormDialog from "../../components/FormDialog";
import TickBox from "../../components/TickBox";
import Button from "../../components/Button";
import useTrackerGrouping from "../../hooks/useTrackerGrouping";

interface GroupOption {
  value: string;
  title: string;
}

interface GroupItem {
  value: string;
  title: string;
  options?: GroupOption[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCustomCreate?: (ids: string[]) => void;
  groups: GroupItem[];
  monitoringID: string;
}

const abbrev = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

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

  const { trackers: trackerGroupings } = useTrackerGrouping();

  const trackerCameraMap = useMemo(() => {
    const map = new Map<string, Set<number>>();
    for (const t of trackerGroupings)
      map.set(String(t.id), new Set(t.cameras.map((c) => c.id)));
    return map;
  }, [trackerGroupings]);

  // map cam_X value → parent tracker value string
  const camToParent = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of groups)
      if (g.options?.length)
        for (const opt of g.options) map.set(opt.value, g.value);
    return map;
  }, [groups]);

  const anchorId = selected[0];
  const anchorCameras = useMemo(() => {
    if (!anchorId) return null;
    if (anchorId.startsWith("cam_"))
      return new Set([Number(anchorId.slice(4))]);
    return trackerCameraMap.get(anchorId) ?? null;
  }, [anchorId, trackerCameraMap]);

  const isEnabled = (value: string): boolean => {
    if (!anchorCameras || !anchorId) return true;
    if (value === anchorId) return true;
    // Same parent tracker → always enabled (e.g. both cameras of Pay Station)
    if (value.startsWith("cam_") && anchorId.startsWith("cam_")) {
      if (camToParent.get(value) === camToParent.get(anchorId)) return true;
    }
    const cams = value.startsWith("cam_")
      ? new Set([Number(value.slice(4))])
      : trackerCameraMap.get(value);
    if (!cams) return false;
    for (const cam of cams) if (anchorCameras.has(cam)) return true;
    return false;
  };

  const handleToggleFlat = (val: string) => {
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
    new BroadcastChannel("timeline-sync").postMessage({
      type: "custom-group",
      ids: selected,
    });
    onClose();
  };

  const uniqueTrackerCount = useMemo(() => {
    const trackers = new Set<string>();
    for (const id of selected) {
      const parent = camToParent.get(id);
      trackers.add(parent ?? id);
    }
    return trackers.size;
  }, [selected, camToParent]);

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

      <CustomScrollbarY height="200px" sx={{ mt: "16px", mb: "40px" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            width: "100%",
          }}
        >
          {groups.flatMap((g) => {
            if (g.options?.length) {
              const prefix = abbrev(g.title);
              return g.options.map((opt) => {
                const enabled =
                  isEnabled(opt.value) || selected.includes(opt.value);
                return (
                  <Box
                    key={opt.value}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <TickBox
                      label={`${prefix} (${opt.title})`}
                      checked={selected.includes(opt.value)}
                      disabled={!enabled}
                      onChange={() => handleToggleFlat(opt.value)}
                    />
                  </Box>
                );
              });
            }

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
                  onChange={() => handleToggleFlat(g.value)}
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
          <Button
            fontSize="14px"
            disabled={uniqueTrackerCount < 2}
            onClick={handleCreate}
          >
            Create Custom Tracker Group
          </Button>
        </Box>
      </Box>
    </FormDialog>
  );
};

export default CustomTrackerDialog;

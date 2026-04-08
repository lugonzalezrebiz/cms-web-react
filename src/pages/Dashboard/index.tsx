import { Box } from "@mui/system";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { CameraContextMenuItem } from "../../components/EventMenu";
import EventMenu from "../../components/EventMenu";
import TimeLine from "../../components/TimeLine";
import CameraLayout, { type CameraInfo } from "../../components/CameraLayout";
import { ToggleButtonTitles } from "../../sections/Header";
import type { CameraEventPoint } from "../../components/timeline/types";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../../theme";

const StyledToggleButton = styled(ToggleButton)({
  color: Colors.mediumGray,
  flex: 1,
  fontFamily: Fonts.main,
  textTransform: "none",
  fontWeight: "normal",
  backgroundColor: Colors.lightGray,
  border: "none",
  margin: 0,
  fontSize: "14px",
  borderRadius: 35,
  whiteSpace: "nowrap",
  "&.Mui-selected": {
    color: Colors.lightBlack,
    backgroundColor: Colors.white,
    //fontWeight: "bold",
  },
  "&.Mui-selected:hover": {
    backgroundColor: Colors.white,
  },
  "&:not(.Mui-selected)": {
    backgroundColor: Colors.lightGray,
  },
});

const StyledToggleGroup = styled(ToggleButtonGroup)({
  padding: 4,
  backgroundColor: Colors.lightGray,
  borderRadius: 30,
  height: "32px",
  width: "100%",
  boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.07)",
  "& .MuiToggleButtonGroup-lastButton": {
    margin: 0,
  },
  "& .MuiToggleButtonGroup-firstButton": {
    margin: 1,
  },
  "& .MuiToggleButtonGroup-grouped": {
    borderRadius: 35,
  },
});

const Dashboard = ({
  selectedTab,
  drawerOpen,
  onTabChange,
}: {
  selectedTab: string;
  drawerOpen?: boolean;
  onTabChange: (value: string) => void;
}) => {
  const cameraCount =
    ToggleButtonTitles.find((t) => t.value === selectedTab)?.cameraCount ?? 4;

  // ── URL params (?company=1&location=2&date=20240101) ──────────────────────
  const [searchParams] = useSearchParams();
  const company = Number(searchParams.get("company") ?? 0);
  const location = Number(searchParams.get("location") ?? 0);
  const date = searchParams.get("date") ?? ""; // YYYYMMDD

  // ── Camera list — read from DVR folder via Electron IPC ──────────────────
  const [cameras, setCameras] = useState<CameraInfo[]>([]);
  useEffect(() => {
    if (!company || !location || !date) return;
    window.api
      .cameras({ company, location, date })
      .then((list) => {
        if (list.length > 0) setCameras(list);
      })
      .catch(() => {});
  }, [company, location, date]);

  // ── Timeline position ─────────────────────────────────────────────────────
  const [timestamp, setTimestamp] = useState(""); // "HH:mm:ss"

  // ── Camera activity overlay ───────────────────────────────────────────────
  const activityCounterRef = useRef(0);
  const [cameraActivities, setCameraActivities] = useState<
    { id: number; cameraIndex: number; activityLabel: string }[]
  >([]);
  const [cameraEventPoints, setCameraEventPoints] = useState<
    CameraEventPoint[]
  >([]);
  const [markerSec, setMarkerSec] = useState<number>(0);
  const markerSecRef = useRef<number>(0);

  const handleRemoveEventPoint = (id: number) => {
    setCameraEventPoints((prev) => prev.filter((ep) => ep.id !== id));
  };

  const handleActivitySelect = (
    cameraIndex: number,
    activityLabel: string,
  ): void => {
    setCameraActivities((prev) => {
      const alreadyExists = prev.some(
        (a) =>
          a.cameraIndex === cameraIndex && a.activityLabel === activityLabel,
      );
      if (alreadyExists) return prev;
      const newId = activityCounterRef.current++;
      return [...prev, { id: newId, cameraIndex, activityLabel }];
    });
    const cameraId = 101 + cameraIndex;
    const timeSec = markerSecRef.current; // Use the current marker position for the event point
    const startSec = Math.floor(timeSec / 3600) * 3600;
    const endSec = startSec + 3600;
    setCameraEventPoints((prev) => {
      const duplicate = prev.some(
        (ep) =>
          ep.cameraId === cameraId &&
          ep.label === activityLabel &&
          Math.abs(timeSec - ep.timeSec) <= 300,
      );
      if (duplicate) return prev;
      return [
        ...prev,
        {
          id: Date.now(),
          cameraId,
          timeSec,
          startSec,
          endSec,
          label: activityLabel,
        },
      ];
    });
  };

  const [extraMenuItems, setExtraMenuItems] = useState<CameraContextMenuItem[]>(
    [],
  );

  const handleAddMenuItem = (label: string) => {
    setExtraMenuItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: label,
        label,
        onClick: (index) => handleActivitySelect(index, label),
      },
    ]);
  };

  const cameraMenuItems: CameraContextMenuItem[] = [
    {
      id: 1,
      name: "Collision",
      label: "Collision",
      onClick: (index) => handleActivitySelect(index, "Collision"),
    },
    {
      id: 2,
      name: "Car door open",
      label: "Car door open",
      onClick: (index) => handleActivitySelect(index, "Car door open"),
    },
    {
      id: 3,
      name: "Violent behaviour",
      label: "Violent behaviour",
      onClick: (index) => handleActivitySelect(index, "Violent behaviour"),
    },
    {
      id: 4,
      name: "Human in tunnel",
      label: "Human in tunnel",
      onClick: (index) => handleActivitySelect(index, "Human in tunnel"),
    },
    {
      id: 5,
      name: "Slip & Fall",
      label: "Slip & Fall",
      onClick: (index) => handleActivitySelect(index, "Slip & Fall"),
    },
  ];

  const allMenuItems = [...cameraMenuItems, ...extraMenuItems];

  const selected = selectedTab;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        gap: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          m: "10px 16px 0 16px",
        }}
      >
        <Box>
          <StyledToggleGroup
            value={selected}
            exclusive
            onChange={(_event, newValue) => {
              if (newValue !== null) onTabChange(newValue);
            }}
            aria-label="Time range"
          >
            {ToggleButtonTitles.map(({ value, title }) => (
              <StyledToggleButton key={value} value={value}>
                {title}
              </StyledToggleButton>
            ))}
          </StyledToggleGroup>
        </Box>

        <EventMenu
          contextMenuTitle="Comp. Violations"
          contextMenuItems={allMenuItems}
          iconMenu="/assets/plus-1.svg"
          onAddItem={handleAddMenuItem}
          cameraEventPoints={cameraEventPoints}
          markerSec={markerSec}
        />
      </Box>

      {/* Camera grid */}
      <Box sx={{ flex: 6, minHeight: 0, height: 0 }}>
        <CameraLayout
          count={cameras.length || cameraCount}
          media="/assets/camera/Cam thumbnail.svg"
          maxHeight="100%"
          cameraItemList={() => alert("Camera list clicked")}
          contextMenuItems={allMenuItems}
          cameraEventPoints={cameraEventPoints}
          markerSec={markerSec}
          onRemoveEventPoint={handleRemoveEventPoint}
          // Real image props
          cameras={cameras}
          company={company}
          location={location}
          date={date}
          timestamp={timestamp}
        />
      </Box>

      {/* Timeline panel */}
      <Box sx={{ flex: 4, minHeight: 0 }}>
        <TimeLine
          selectedTab={selectedTab}
          cameraActivities={cameraActivities}
          cameraEventPoints={cameraEventPoints}
          onMarkerChange={(sec) => {
            markerSecRef.current = sec;
            setMarkerSec(sec);
          }}
          drawerOpen={drawerOpen}
          onTimeChange={setTimestamp}
        />
      </Box>
    </Box>
  );
};

export default Dashboard;

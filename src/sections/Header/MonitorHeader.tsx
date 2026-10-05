import { useEffect, useState } from "react";
import { IconButton, useMediaQuery } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import MenuIcon from "@mui/icons-material/Menu";
import { Box } from "@mui/system";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../../theme";
import HeaderInfoMenu from "../../components/HeaderInfoMenu";
import useAssignments from "../../hooks/useAssignments";
import KeyboardMenu, {
  type KeyboardMenuData,
} from "../../components/KeyboardMenu";
import UserPanel from "../../components/UserPanel";
import Divider from "../../components/Divider";
import Fix from "../../components/Fix";
import usePopover from "./hooks/usePopover";
import useMonitorParams from "./hooks/useMonitorParams";
import useNavigateWithQuery, {
  useLocationState,
} from "../../hooks/useNavigate";
import type { NavigationAssignment } from "../../pages/Assignments/hooks/useAssignmentNavigate";
import {
  useMonitorState,
  useCameraGroup,
  useTimelineTab,
} from "../../contexts/useMonitorContext";
import type { NavTab } from "../../components/timeline/types";
import Button from "../../components/Button";
import ToggleButton from "../../components/ToggleButton";
import CustomTrackerDialog from "./CustomTrackerDialog";
import useTrackerOptions from "./hooks/useTrackerOptions";
import { AGENT_ROLE } from "../../config";
import useAuth from "../../hooks/useAuth";
import useCompanyConfig from "../../hooks/useCompanyConfig";
import useTrackers from "../../hooks/useTrackers";
import { useTrackerGroupResolution } from "../../pages/Monitor/hooks/useTrackerGroupResolution";

const isMac =
  typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
const mod = isMac ? "⌘" : "Ctrl";
const alt = isMac ? "⌥" : "Alt";

type ShortcutItem = KeyboardMenuData["items"][number];

const textKey = (label: string, fontSize = "16px") =>
  ({ type: "text", label, fontSize }) as const;
const arrowKey = (dir: "left" | "right") =>
  ({ type: "img", src: `./assets/arrow-narrow-${dir}.svg` }) as const;

// Shortcuts every timeline tab shares.
const markerStepItems = (imagesInterval: number): ShortcutItem[] => [
  {
    keys: [arrowKey("left")],
    label: `Move marker back ${imagesInterval} sec`,
  },
  {
    keys: [arrowKey("right")],
    label: `Move marker forward ${imagesInterval} sec`,
  },
];

// Punches tabs: jump between session bars and delete one.
const sessionBarItems: ShortcutItem[] = [
  { keys: [textKey(mod, "14px"), arrowKey("left")], label: "Previous bar" },
  { keys: [textKey(mod, "14px"), arrowKey("right")], label: "Next bar" },
];
const deleteBarItem: ShortcutItem = {
  keys: [textKey("DEL", "12px")],
  label: "Delete selected bar",
};

const goBackItem: ShortcutItem = {
  keys: [textKey(alt, "12px"), arrowKey("left")],
  label: "Go back",
};

const undoRedoItems: ShortcutItem[] = [
  { keys: [textKey(mod, "14px"), textKey("Z")], label: "Undo" },
  { keys: [textKey(mod, "14px"), textKey("Y")], label: "Redo" },
];

const playbackAndZoomItems: ShortcutItem[] = [
  { keys: [textKey("H")], label: "Move to start" },
  { keys: [textKey("Space", "12px")], label: "Play / Pause" },
  { keys: [textKey(mod, "14px"), textKey("+")], label: "Zoom in" },
  { keys: [textKey(mod, "14px"), textKey("-")], label: "Zoom out" },
];

const getComplianceShortcuts = (
  imagesInterval: number,
  activeTracker?: { mode: "POINT" | "RANGE"; values: string[] },
): ShortcutItem[] => {
  const isPointDual =
    activeTracker?.mode === "POINT" && activeTracker.values.length === 2;
  const isRange = activeTracker?.mode === "RANGE";

  const ioItems: ShortcutItem[] = isPointDual
    ? [
        { keys: [textKey("I")], label: activeTracker.values[0] },
        { keys: [textKey("O")], label: activeTracker.values[1] },
      ]
    : isRange
      ? [
          {
            keys: [textKey("I")],
            label: "Accept event point on the selected line",
          },
        ]
      : [];

  return [
    ...markerStepItems(imagesInterval),
    {
      keys: [textKey(mod, "14px"), arrowKey("left")],
      label: "Previous event point",
    },
    {
      keys: [textKey(mod, "14px"), arrowKey("right")],
      label: "Next event point",
    },
    goBackItem,
    ...undoRedoItems,
    ...ioItems,
    { keys: [textKey("1-9, 0", "14px")], label: "Select tracker line" },
    { keys: [textKey("H")], label: "Move to start" },
    {
      keys: [textKey("DEL", "12px")],
      label: "Delete event point under marker",
    },
    ...playbackAndZoomItems.slice(1),
  ];
};

const getEmployeePunchesShortcuts = (imagesInterval: number): ShortcutItem[] => [
  ...markerStepItems(imagesInterval),
  ...sessionBarItems,
  goBackItem,
  ...undoRedoItems,
  { keys: [textKey("+")], label: "Add employee" },
  { keys: [textKey("I")], label: "Punch in on the selected line" },
  { keys: [textKey("O")], label: "Punch out on the selected line" },
  { keys: [textKey("1-9, 0", "14px")], label: "Select employee line" },
  deleteBarItem,
  ...playbackAndZoomItems,
];

const getCustomerPunchesShortcuts = (imagesInterval: number): ShortcutItem[] => [
  ...markerStepItems(imagesInterval),
  ...sessionBarItems,
  goBackItem,
  ...undoRedoItems,
  { keys: [textKey("I")], label: "Customer punch in on the selected line" },
  {
    keys: [textKey("↑"), textKey("↓")],
    label: "Select a customer on the selected line",
  },
  { keys: [textKey("O")], label: "Punch out the selected customer" },
  { keys: [textKey("1-9, 0", "14px")], label: "Select line" },
  deleteBarItem,
  ...playbackAndZoomItems,
];

// Unattended works as in Customer punches; "+" (and "i" with no line
// selected) adds an employee, and lines are numbered from 0.
const getEmployeesCustomersShortcuts = (
  imagesInterval: number,
): ShortcutItem[] => [
  ...markerStepItems(imagesInterval),
  ...sessionBarItems,
  goBackItem,
  ...undoRedoItems,
  { keys: [textKey("+")], label: "Add employee" },
  { keys: [textKey("I")], label: "Customer punch in on Unattended" },
  { keys: [textKey("C")], label: "Assign a customer to the employee" },
  { keys: [textKey("B")], label: "Move the employee to the Back Room" },
  { keys: [textKey("S")], label: "Move the employee to the Show Room" },
  {
    keys: [textKey("↑"), textKey("↓")],
    label: "Select a customer on the selected line",
  },
  { keys: [textKey("O")], label: "Punch out the selected line" },
  { keys: [textKey("0-9", "14px")], label: "Select line" },
  deleteBarItem,
  ...playbackAndZoomItems,
];

const getKeyboardShortcuts = (
  imagesInterval: number,
  activeTab: NavTab,
  activeTracker?: { mode: "POINT" | "RANGE"; values: string[] },
): KeyboardMenuData => ({
  title: "Keyboard shortcuts",
  items:
    activeTab === "employees"
      ? getEmployeePunchesShortcuts(imagesInterval)
      : activeTab === "customers"
        ? getCustomerPunchesShortcuts(imagesInterval)
        : activeTab === "employeesCustomers"
          ? getEmployeesCustomersShortcuts(imagesInterval)
          : getComplianceShortcuts(imagesInterval, activeTracker),
});

const StyledContainer = styled("div")({
  display: "flex",
  padding: "0.5em 1em 0.5em 0",
  alignItems: "center",
  gap: "10px",
  justifyContent: "space-between",
});

const StyledTitle = styled("p")({
  margin: 0,
  fontSize: "16px",
  fontWeight: "600",
  lineHeight: 1.5,
  color: Colors.lightBlack,
  fontFamily: Fonts.main,
});

const StyledSubTitle = styled("p")({
  margin: 0,
  fontSize: "12px",
  fontWeight: "normal",
  lineHeight: 1.5,
  color: Colors.vividOrange,
  fontFamily: Fonts.main,
});

const StyledImg = styled("img")({
  margin: "0 8px",
  cursor: "pointer",
});

const MAX_VISIBLE = 3;

const MonitorHeader = ({
  toggleDrawer,
  withIconMenu = true,
  allowGoBack = false,
}: {
  toggleDrawer: () => void;
  withIconMenu?: boolean;
  allowGoBack?: boolean;
}) => {
  const isSmall = useMediaQuery("(max-width: 1050px)");
  const { user } = useAuth();
  const isAgent = user?.roleID === AGENT_ROLE;
  const [scrolled, setScrolled] = useState(false);
  const menuHeader = usePopover();
  const keyboardMenu = usePopover();
  const userPanelHeader = usePopover();
  const navigate = useNavigateWithQuery();
  const goBack = () => navigate(-1);
  const {
    companyLabel,
    storeLabel,
    formattedDate,
    companyID,
    locationID,
    monitoringID,
  } = useMonitorParams();
  const navState = useLocationState<{ assignment: NavigationAssignment }>();
  const { assignments } = useAssignments({ companyID, locationID });
  const { imagesInterval } = useCompanyConfig();
  const { singleTrackerID } = useTrackerGroupResolution();
  const { trackers } = useTrackers();
  const activeTracker = trackers.find((t) => t.id === singleTrackerID);
  const { activeTab } = useTimelineTab();
  const keyboardShortcuts = getKeyboardShortcuts(
    imagesInterval,
    activeTab,
    activeTracker,
  );
  const assignment =
    navState?.assignment ??
    assignments.find((a) => a.monitoringID === monitoringID) ??
    null;
  const toHHmm = (t: string | null) => (t ? t.slice(0, 5) : "----");
  const timeRange = assignment
    ? `${toHHmm(assignment.open)} - ${toHHmm(assignment.close)}`
    : "----";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { handleDone, isDoneLoading, unreviewedTrackerIds, aiTrackerIds } =
    useMonitorState();
  const { cameraGroup, setCameraGroup, setCustomTrackerIDs } = useCameraGroup();

  useEffect(() => {
    if (!monitoringID) return;
    try {
      const saved = sessionStorage.getItem(
        `custom_tracker_group_${monitoringID}`,
      );
      if (saved) setCustomTrackerIDs(JSON.parse(saved) as string[]);
    } catch {
      /* ignore invalid JSON */
    }
  }, [monitoringID, setCustomTrackerIDs]);
  const { trackerOptions } = useTrackerOptions(unreviewedTrackerIds);

  const allGroups = [...trackerOptions]
    .map((g) => ({ ...g, everHadAI: aiTrackerIds.has(Number(g.value)) }))
    .sort((a, b) => {
      const aiDiff = (b.hasAI ? 1 : 0) - (a.hasAI ? 1 : 0);
      if (aiDiff !== 0) return aiDiff;
      return (b.options ? 1 : 0) - (a.options ? 1 : 0);
    });
  // Membership uses the persisted everHadAI (stays visible once reviewed),
  // while each group's `hasAI` icon still reflects live unreviewedTrackerIds.
  const aiGroups = allGroups.filter((g) => g.everHadAI);

  useEffect(() => {
    if (cameraGroup === "tracker" && aiGroups.length > 0) {
      setCameraGroup(aiGroups[0].value);
    }
  }, [cameraGroup, aiGroups, setCameraGroup]);
  const overflowGroups = aiGroups.slice(MAX_VISIBLE);
  const cameraGroups = [
    ...aiGroups.slice(0, MAX_VISIBLE),
    ...(overflowGroups.length > 0
      ? [
          {
            value: "__other__",
            title: "Other",
            options: overflowGroups,
            hasAI: overflowGroups.some((g) => g.hasAI),
          },
        ]
      : []),
  ];

  const [customOpen, setCustomOpen] = useState(false);
  const [hasCustomGroup, setHasCustomGroup] = useState(
    () => !!sessionStorage.getItem(`custom_tracker_group_${monitoringID}`),
  );

  const toggleButton = (
    <ToggleButton
      value={cameraGroup}
      setValue={setCameraGroup}
      label="Camera Groups"
      groups={cameraGroups}
      onCustomClick={() => setCustomOpen(true)}
      customCreated={hasCustomGroup}
    />
  );

  return (
    <Fix scrolled={scrolled}>
      <StyledContainer>
        {isSmall ? (
          <>
            {allowGoBack && (
              <IconButton
                sx={{ color: Colors.main }}
                onClick={goBack}
                aria-label="go back"
              >
                <ArrowBackIosNewIcon fontSize="small" />
              </IconButton>
            )}
            {withIconMenu && (
              <IconButton
                edge="start"
                sx={{ color: Colors.main }}
                onClick={toggleDrawer}
                aria-label="menu"
              >
                <MenuIcon />
              </IconButton>
            )}
          </>
        ) : (
          <>
            {withIconMenu && (
              <IconButton
                edge="start"
                sx={{ color: Colors.main }}
                onClick={toggleDrawer}
                aria-label="menu"
              >
                <MenuIcon />
              </IconButton>
            )}
            {allowGoBack && (
              <IconButton
                sx={{ color: Colors.main }}
                onClick={goBack}
                aria-label="go back"
              >
                <ArrowBackIosNewIcon fontSize="small" />
              </IconButton>
            )}
          </>
        )}

        <Box
          display={"flex"}
          alignItems="center"
          justifyContent={"space-between"}
          width={"100%"}
        >
          <Box
            onClick={menuHeader.handleOpen}
            sx={{
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              cursor: "pointer",
            }}
          >
            <StyledTitle>
              Store: {storeLabel} ({companyLabel})
            </StyledTitle>
            <StyledSubTitle>
              {formattedDate} / {timeRange} / Events
            </StyledSubTitle>
          </Box>

          {!isSmall && <Box>{toggleButton}</Box>}

          <Box display={"flex"} alignItems="center" gap={1}>
            <StyledImg
              onClick={keyboardMenu.handleOpen}
              src="./assets/keyboard-02.svg"
              alt=""
            />
            <StyledImg
              onClick={userPanelHeader.handleOpen}
              src="./assets/user-circle.svg"
              alt=""
            />
            <Box>
              <Button
                sx={{ height: "36px" }}
                fontSize="14px"
                disabled={isAgent || isDoneLoading}
                onClick={handleDone}
              >
                {isDoneLoading ? "Loading..." : "Done"}
              </Button>
            </Box>
          </Box>
        </Box>
      </StyledContainer>

      {isSmall && (
        <Box mb={"10px"} display={"flex"} justifyContent={"center"}>
          {toggleButton}
        </Box>
      )}

      <HeaderInfoMenu
        anchorEl={menuHeader.anchorEl}
        handleClose={menuHeader.handleClose}
        open={menuHeader.open}
        info={assignment ?? undefined}
      />

      <KeyboardMenu
        anchorEl={keyboardMenu.anchorEl}
        open={keyboardMenu.open}
        handleClose={keyboardMenu.handleClose}
        data={keyboardShortcuts}
      />

      <UserPanel
        anchorEl={userPanelHeader.anchorEl}
        handleClose={userPanelHeader.handleClose}
        open={userPanelHeader.open}
      />
      <Divider marginBottom="0" />

      <CustomTrackerDialog
        key={customOpen ? monitoringID : "closed"}
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        onCustomCreate={(ids) => {
          setHasCustomGroup(true);
          setCustomTrackerIDs(ids);
          setCameraGroup("__custom__");
        }}
        groups={allGroups}
        monitoringID={monitoringID}
      />
    </Fix>
  );
};

export default MonitorHeader;

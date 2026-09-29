import { Box } from "@mui/system";
import styled from "@emotion/styled";
import Dialog from "../Dialog";
import Button from "../Button";
import { Colors, Fonts } from "../../theme";
import { assetUrl } from "../../utils";
import PunchPickerPanel from "./PunchPickerPanel";
import type {
  DialogEmployee,
  EmployeeDialogTab,
  EmployeeDialogTabItem,
} from "./constants";

interface Props {
  open: boolean;
  onClose: () => void;
  tabs: EmployeeDialogTabItem[];
  selectedTab: EmployeeDialogTab;
  onTabChange: (tab: EmployeeDialogTab) => void;
  employees: DialogEmployee[];
  selectedEmployeeId: number | null;
  onSelectEmployee: (id: number) => void;
  cameraCount: number;
  selectedCamera: number;
  onSelectCamera: (index: number) => void;
  previewSrc: string;
  onPunchInUnknown: () => void;
  onPunchInSelected: () => void;
}

const TabItem = styled(Box, {
  shouldForwardProp: (prop) => prop !== "selected",
})<{ selected?: boolean }>(({ selected }) => ({
  backgroundColor: selected ? Colors.vividOrange : Colors.white,
  color: selected ? Colors.white : Colors.lightBlack,
  padding: "8px 16px",
  width: "100px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "5px",
  fontFamily: Fonts.main,
  fontSize: "14px",
  lineHeight: "20px",
  borderRadius: "4px",
  cursor: "pointer",
  "& img": {
    filter: selected ? "brightness(0) invert(1)" : "none",
  },
}));

const EmployeePunchDialog = ({
  open,
  onClose,
  tabs,
  selectedTab,
  onTabChange,
  employees,
  selectedEmployeeId,
  onSelectEmployee,
  cameraCount,
  selectedCamera,
  onSelectCamera,
  previewSrc,
  onPunchInUnknown,
  onPunchInSelected,
}: Props) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      bgColor={Colors.softWhite}
      footer={
        <Box sx={{ display: "flex", gap: "16px", pb: "16px" }}>
          <Button
            style={{ padding: "0 15px", height: "36px" }}
            outfit
            color="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            style={{ padding: "0 15px", height: "36px" }}
            outfit
            onClick={onPunchInUnknown}
          >
            Punch in as Unknown
          </Button>
          <Button
            style={{ padding: "0 15px", height: "36px" }}
            outfit
            disabled={selectedEmployeeId === null}
            onClick={onPunchInSelected}
          >
            Punch in Select
          </Button>
        </Box>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Tabs + close */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box sx={{ display: "flex", gap: "8px" }}>
            {tabs.map((tab) => (
              <TabItem
                key={tab.key}
                selected={selectedTab === tab.key}
                onClick={() => onTabChange(tab.key)}
              >
                <img src={assetUrl(tab.icon)} alt="" />
                {tab.label}
              </TabItem>
            ))}
          </Box>
          <Box sx={{ cursor: "pointer", display: "flex" }} onClick={onClose}>
            <img src={assetUrl("x-close.svg")} alt="Close" />
          </Box>
        </Box>

        <PunchPickerPanel
          items={employees.map((employee) => ({
            id: employee.id,
            title: employee.name,
            lines: [employee.lastSeen, employee.role],
          }))}
          selectedId={selectedEmployeeId}
          onSelect={onSelectEmployee}
          cameraCount={cameraCount}
          selectedCamera={selectedCamera}
          onSelectCamera={onSelectCamera}
          previewSrc={previewSrc}
        />
      </Box>
    </Dialog>
  );
};

export default EmployeePunchDialog;

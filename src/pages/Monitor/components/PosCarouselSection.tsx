import { Box } from "@mui/system";
import { IconButton } from "@mui/material";
import { Check } from "@mui/icons-material";
import MediaCarousel from "../../../components/MediaCarousel";
import Button from "../../../components/Button";
import { Colors } from "../../../theme";
import type { CameraContextMenuItem } from "../../../components/EventMenu";
import type { SalesTransaction } from "../hooks/useSalesTransactions";
import type { AttendedValue } from "../hooks/usePosCarousel";

interface Props {
  company: number;
  location: number;
  transactions: SalesTransaction[];
  loading: boolean;
  current: number;
  prev: () => void;
  next: () => void;
  goTo: (index: number) => void;
  currentTimeSec: number;
  currentCameraId: number;
  allMenuItems: CameraContextMenuItem[];
  onMarkerChange: (sec: number) => void;
  onActivitySelect: (cameraIndex: number, label: string) => void;
  attended: AttendedValue | null;
  onToggleAttended: (value: AttendedValue) => void;
  onDone: () => void;
}

export function PosCarouselSection({
  company,
  location,
  transactions,
  loading,
  current,
  prev,
  next,
  goTo,
  currentTimeSec,
  currentCameraId,
  allMenuItems,
  onMarkerChange,
  onActivitySelect,
  attended,
  onToggleAttended,
  onDone,
}: Props) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <MediaCarousel
          company={company}
          location={location}
          transactions={transactions}
          loading={loading}
          current={current}
          prev={prev}
          next={next}
          goTo={goTo}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("eventmenuid")) e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            const itemId = Number(e.dataTransfer.getData("eventMenuItemId"));
            if (!itemId) return;
            const item = allMenuItems.find((m) => m.id === itemId);
            if (!item) return;
            onMarkerChange(currentTimeSec);
            onActivitySelect(currentCameraId - 1, item.label);
          }}
        />
      </Box>
      <Box
        sx={{
          display: "flex",
          gap: 0.75,
          alignItems: "center",
          justifyContent: "flex-end",
          px: 2,
          pb: 1,
          mr: "20px",
        }}
      >
        <Button
          color="secondary"
          selected={attended === "attended"}
          onClick={() => onToggleAttended("attended")}
          disableRipple={false}
          sx={{ height: "32px" }}
        >
          Attended
        </Button>
        <Button
          color="secondary"
          selected={attended === "unattended"}
          onClick={() => onToggleAttended("unattended")}
          disableRipple={false}
          sx={{ height: "32px" }}
        >
          Unattended
        </Button>
        {attended !== null && (
          <Box bgcolor={Colors.vividOrange} borderRadius="6px">
            <IconButton onClick={onDone} size="small">
              <Check fontSize="small" sx={{ color: Colors.white }} />
            </IconButton>
          </Box>
        )}
      </Box>
    </Box>
  );
}

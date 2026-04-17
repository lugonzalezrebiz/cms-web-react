import { useState, useEffect, useMemo } from "react";
import { Box, IconButton, Typography, CircularProgress } from "@mui/material";
import { ChevronLeft, ChevronRight, Check } from "@mui/icons-material";
import styled from "@emotion/styled";
import MuiButton from "@mui/material/Button";
import { Colors, Fonts } from "../theme";
import {
  useSalesTransactions,
  type SalesTransaction,
} from "../pages/Dashboard/hooks/useSalesTransactions";
import { useCameraFrame } from "../hooks/useCameraFrame";
import { useCarousel } from "../hooks/useCarousel";
import { useSaveMonitoring } from "./timeline/hooks/useSaveMonitoring";

type AttendedValue = "attended" | "unattended";

const AttendanceButton = styled(MuiButton, {
  shouldForwardProp: (prop) => prop !== "selected",
})<{ selected?: boolean }>(({ selected }) => ({
  borderRadius: "18px",
  fontFamily: Fonts.secondary,
  fontSize: "14px",
  fontWeight: "600",
  textTransform: "none",
  boxShadow: "none",
  padding: "4px 16px",
  border: `1px solid ${Colors.main}`,
  backgroundColor: selected ? Colors.main : Colors.white,
  color: selected ? Colors.white : Colors.main,
  "&:hover": {
    backgroundColor: selected ? Colors.orangeHover : Colors.secondary,
    boxShadow: "none",
  },
}));

// Parses "2026-04-07 08:12:00" → { date: "20260407", time: "08:12:00" }
function parseTransactionTimestamp(ts: string): { date: string; time: string } {
  const [datePart, timePart] = ts.split(" ");
  const date = (datePart ?? "").replace(/-/g, "");
  const time = timePart ?? "00:00:00";
  return { date, time };
}

interface CarouselSlideProps {
  transaction: SalesTransaction;
  company: number;
  location: number;
  visible: boolean;
}

const CarouselSlide = ({
  transaction,
  company,
  location,
  visible,
}: CarouselSlideProps) => {
  const { date, time } = parseTransactionTimestamp(transaction.timestamp);
  const src = useCameraFrame({
    company,
    location,
    date,
    camera: transaction.terminal.id,
    timestamp: time,
  });
  const fallback = "/assets/camera/Cam thumbnail.svg";

  return (
    <Box
      sx={{
        minWidth: "100%",
        height: "100%",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <Box
        component="img"
        src={src || fallback}
        alt={`${transaction.terminal.code} – ${transaction.timestamp}`}
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          userSelect: "none",
          pointerEvents: "none",
        }}
      />
      {/* Slide info badge */}
      {visible && (
        <Box
          sx={{
            position: "absolute",
            bottom: 8,
            left: 12,
            backgroundColor: "rgba(0,0,0,0.55)",
            color: "#fff",
            fontSize: 11,
            px: 1,
            py: 0.25,
            borderRadius: 1,
            lineHeight: 1.5,
          }}
        >
          <strong>{transaction.terminal.code}</strong> · {transaction.zone.name}
          <br />
          {transaction.timestamp}
        </Box>
      )}
    </Box>
  );
};

interface MediaCarouselProps {
  company: number;
  location: number;
  transactions?: SalesTransaction[];
  title?: string;
  onSlideChange?: (markerSec: number) => void;
  onDropMenuItem?: (itemId: number, cameraId: number, timeSec: number) => void;
}

const MediaCarousel = ({
  company,
  location,
  transactions: transactionsProp,
  title = "",
  onSlideChange,
  onDropMenuItem,
}: MediaCarouselProps) => {
  const { transactions: fetched, loading } = useSalesTransactions();
  const transactions = transactionsProp ?? fetched;
  const [attended, setAttended] = useState<AttendedValue | null>(null);

  const toggleAttended = (value: AttendedValue) =>
    setAttended((prev) => (prev === value ? null : value));

  const count = transactions.length;

  const toMarkerSec = (tx: SalesTransaction) => {
    const [, time] = tx.timestamp.split(" ");
    const [h, m, s] = (time ?? "00:00:00").split(":").map(Number);
    return h * 3600 + m * 60 + (s ?? 0);
  };

  const { current, goTo, prev, next } = useCarousel(count, (index) => {
    const tx = transactions[index];
    if (tx) onSlideChange?.(toMarkerSec(tx));
  });

  const currentTx = transactions[current];
  const sessionDate = currentTx?.timestamp.split(" ")[0] ?? "";
  const eventPoints = useMemo(() => {
    if (!currentTx) return [];
    const timeSec = toMarkerSec(currentTx);
    return [
      {
        id: 8 * 10000 + currentTx.terminal.id,
        cameraId: currentTx.terminal.id,
        timeSec,
        startSec: timeSec,
        endSec: timeSec,
        label: "Pay Station Attendance",
      },
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTx]);

  const { handleDone } = useSaveMonitoring({
    trackers: [{ id: 8, name: "Pay Station Attendance", attended: attended === "attended" }],
    eventPoints,
    sessionDate,
  });

  // Sync marker on initial load (and when transactions first arrive)
  useEffect(() => {
    const tx = transactions[current];
    if (tx) onSlideChange?.(toMarkerSec(tx));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions.length]);

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("eventmenuid")) e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const itemId = Number(e.dataTransfer.getData("eventMenuItemId"));
    const tx = transactions[current];
    if (!itemId || !tx) return;
    onDropMenuItem?.(itemId, tx.terminal.id, toMarkerSec(tx));
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "96.5%",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        margin: "0 1.5rem",
      }}
    >
      <Typography
        sx={{
          color: Colors.lightBlack,
          fontWeight: 600,
          fontSize: 15,
          alignSelf: "flex-start",
          ml: 1,
        }}
      >
        {title}
      </Typography>
      <Box
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        sx={{
          position: "relative",
          width: "100%",
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          borderRadius: 3,
          backgroundColor: Colors.blushWhite,
        }}
      >
        {loading ? (
          <CircularProgress size={32} sx={{ color: Colors.main }} />
        ) : count === 0 ? (
          <Typography sx={{ color: Colors.mediumGray, fontSize: 13 }}>
            No transactions
          </Typography>
        ) : (
          <>
            {/* Slides */}
            <Box
              sx={{
                display: "flex",
                width: "100%",
                height: "100%",
                transition: "transform 0.35s ease",
                transform: `translateX(-${current * 100}%)`,
              }}
            >
              {transactions.map((tx, i) => (
                <CarouselSlide
                  key={`${tx.terminal.id}-${tx.timestamp}`}
                  transaction={tx}
                  company={company}
                  location={location}
                  visible={i === current}
                />
              ))}
            </Box>

            {/* Prev button */}
            <IconButton
              onClick={prev}
              size="small"
              sx={{
                position: "absolute",
                left: 8,
                backgroundColor: "rgba(255,255,255,0.85)",
                "&:hover": { backgroundColor: "rgba(255,255,255,1)" },
                boxShadow: 1,
              }}
            >
              <ChevronLeft fontSize="small" />
            </IconButton>

            {/* Next button */}
            <IconButton
              onClick={next}
              size="small"
              sx={{
                position: "absolute",
                right: 8,
                backgroundColor: "rgba(255,255,255,0.85)",
                "&:hover": { backgroundColor: "rgba(255,255,255,1)" },
                boxShadow: 1,
              }}
            >
              <ChevronRight fontSize="small" />
            </IconButton>

            {/* Slide counter */}
            <Box
              sx={{
                position: "absolute",
                bottom: 8,
                right: 12,
                backgroundColor: "rgba(0,0,0,0.55)",
                color: "#fff",
                fontSize: 11,
                px: 1,
                py: 0.25,
                borderRadius: 1,
              }}
            >
              {current + 1} / {count}
            </Box>
          </>
        )}
      </Box>
      {/* Bottom bar: dots + attendance buttons */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          gap: 1,
        }}
      >
        {/* Dot indicators */}
        {count > 0 && (
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", flex: 1 }}>
            {transactions.map((_, i) => (
              <Box
                key={i}
                onClick={() => goTo(i)}
                sx={{
                  width: i === current ? 18 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    i === current ? Colors.main : Colors.mediumGray,
                  cursor: "pointer",
                  transition: "width 0.25s ease, background-color 0.25s ease",
                }}
              />
            ))}
          </Box>
        )}

        {/* Attendance toggle buttons */}
        <Box sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
          <AttendanceButton
            selected={attended === "attended"}
            onClick={() => toggleAttended("attended")}
            disableRipple={false}
          >
            Attended
          </AttendanceButton>
          <AttendanceButton
            selected={attended === "unattended"}
            onClick={() => toggleAttended("unattended")}
            disableRipple={false}
          >
            Unattended
          </AttendanceButton>

          {/* Confirm button — only visible when an option is selected */}
          {attended !== null && (
            <Box bgcolor={Colors.vividOrange} borderRadius={"6px"}>
              <IconButton
                onClick={handleDone}
                size="small"
                sx={{
                  color: Colors.main,
                }}
              >
                <Check fontSize="small" sx={{ color: Colors.white }} />
              </IconButton>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default MediaCarousel;

import { Box, IconButton, Typography, CircularProgress } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Colors } from "../theme";
import type { SalesTransaction } from "../pages/Monitor/hooks/useSalesTransactions";
import { useCameraFrame } from "../hooks/useCameraFrame";

// Parses "2026-04-07 08:12:00" → { date: "20260407", time: "08:12:00" }
const parseTransactionTimestamp = (ts: string): { date: string; time: string } => {
  const [datePart, timePart] = ts.split(" ");
  const date = (datePart ?? "").replace(/-/g, "");
  const time = timePart ?? "00:00:00";
  return { date, time };
};

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
  transactions: SalesTransaction[];
  loading: boolean;
  title?: string;
  current: number;
  prev: () => void;
  next: () => void;
  goTo: (i: number) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

const MediaCarousel = ({
  company,
  location,
  transactions,
  loading,
  title = "",
  current,
  prev,
  next,
  goTo,
  onDragOver,
  onDrop,
}: MediaCarouselProps) => {
  const count = transactions.length;

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
        onDragOver={onDragOver}
        onDrop={onDrop}
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
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          gap: 1,
        }}
      >
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
      </Box>
    </Box>
  );
};

export default MediaCarousel;

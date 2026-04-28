import { Box } from "@mui/system";
import { Colors, Fonts } from "../../theme";
import type { FlatRow } from "./types";

interface RowItemProps {
  row: FlatRow;
  isSelected: boolean;
  iTrackId: number | null;
  activeSessionStarts: Record<number, number>;
  setITrackId: React.Dispatch<React.SetStateAction<number | null>>;
  setSelectedTracks: React.Dispatch<React.SetStateAction<Set<number>>>;
}

const RowItem = ({
  row,
  isSelected,
  iTrackId,
  activeSessionStarts,
  setITrackId,
  setSelectedTracks,
}: RowItemProps) => {
  const isEventSubRow = row.kind === "event";
  const isActivityRow = row.kind === "activity";

  const isEventWithActiveParent =
    row.kind === "event" &&
    row.parentCameraId !== undefined &&
    iTrackId === row.parentCameraId;

  const isFocused = iTrackId === row.id;

  const isActive = isSelected || isFocused;

  const handleClick = isEventSubRow
    ? undefined
    : () => {
        setITrackId(row.id);
        if (activeSessionStarts[row.id] !== undefined) {
          setSelectedTracks(new Set([row.id]));
        } else {
          setSelectedTracks(new Set());
        }
      };

  const bgColor = (() => {
    if (isEventSubRow)
      return isActive || isEventWithActiveParent
        ? Colors.blushWhite
        : "transparent";
    if (isActive) return Colors.vividOrange;
    return "transparent";
  })();

  const textColor = (() => {
    if (isEventSubRow) return Colors.lightBlack;
    if (isActive) return Colors.white;
    return Colors.lightBlack;
  })();

  return (
    <Box
      onClick={handleClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: isEventSubRow ? 0 : 1.5,
        pl: isEventSubRow ? "50px" : "8px",
        pr: "8px",
        py: "6px",
        cursor: "pointer",
        fontFamily: Fonts.main,
        fontSize: 14,
        height: "32px",
        lineHeight: 1.43,
        fontWeight: 400,
        backgroundColor: bgColor,
        color: textColor,
      }}
    >
      {!isEventSubRow && !isActivityRow && (
        <Box
          sx={{
            width: "20px",
            height: "20px",
            borderRadius: "50px",
            backgroundColor: isActive ? Colors.white : Colors.vividOrange,
            color: isActive ? Colors.vividOrange : Colors.white,
            display: "flex",
            justifyContent: "center",
            fontSize: "12px",
            alignItems: "center",
            fontWeight: 700,
            fontFamily: Fonts.main,
            padding: 0,
          }}
        >
          <span style={{ marginTop: "2px" }}>{row.cameraNumber}</span>
        </Box>
      )}
      {row.name}
    </Box>
  );
};

interface TimelineRowListProps {
  flatRows: FlatRow[];
  selectedTracks: Set<number>;
  activeSessionStarts: Record<number, number>;
  headerLabel: string;
  listBodyRef: React.RefObject<HTMLDivElement | null>;
  rowsScrollRef: React.RefObject<HTMLDivElement | null>;
  iTrackId: number | null;
  setITrackId: React.Dispatch<React.SetStateAction<number | null>>;
  setSelectedTracks: React.Dispatch<React.SetStateAction<Set<number>>>;
  dialogOnClose?: () => void;
  onOpenDialog?: () => void;
  openDialog?: boolean;
}

export const TimelineRowList = ({
  flatRows,
  selectedTracks,
  activeSessionStarts,
  headerLabel,
  listBodyRef,
  rowsScrollRef,
  iTrackId,
  setITrackId,
  setSelectedTracks,
  onOpenDialog,
}: TimelineRowListProps) => {
  return (
    <Box
      sx={{
        minWidth: 130,
        maxWidth: 220,
        background: Colors.white,
        borderRight: `1px solid ${Colors.lightGrayishBlue}`,
        display: "flex",
        flexDirection: "column",
        zIndex: 1,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${Colors.lightGrayishBlue}`,
          height: "28px",
          width: "100%",
          maxWidth: "175px",
          padding: "0 4px 0 8px",
        }}
      >
        <p
          style={{
            textTransform: "capitalize",
            fontFamily: Fonts.main,
            fontSize: 12,
            color: Colors.lightBlack,
            lineHeight: 1.5,
            margin: 0,
            fontWeight: 700,
          }}
        >
          {headerLabel}
        </p>
        <Box sx={{ cursor: "pointer" }} onClick={onOpenDialog}>
          <img src="../assets/plus-1.svg" alt="Add row" />
        </Box>
      </Box>

      {/* List */}
      <Box
        ref={listBodyRef}
        onScroll={() => {
          if (rowsScrollRef.current && listBodyRef.current) {
            rowsScrollRef.current.scrollTop = listBodyRef.current.scrollTop;
          }
        }}
        sx={{
          flex: 1,
          overflowY: "auto",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {flatRows.map((row) => (
          <RowItem
            key={row.id}
            row={row}
            isSelected={selectedTracks.has(row.id)}
            iTrackId={iTrackId}
            activeSessionStarts={activeSessionStarts}
            setITrackId={setITrackId}
            setSelectedTracks={setSelectedTracks}
          />
        ))}
        {flatRows.filter((r) => r.kind !== "event").length === 0 && (
          <Box
            sx={{
              width: "129px",
              height: "54px",
              m: "25px auto",
              fontFamily: Fonts.main,
              fontSize: 12,
              color: Colors.dimGray,
              lineHeight: 1.5,
              textAlign: "center",
            }}
          >
            Empty
          </Box>
        )}
      </Box>
    </Box>
  );
};

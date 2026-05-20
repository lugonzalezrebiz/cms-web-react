import { Box } from "@mui/system";
import { Colors, Fonts } from "../../theme";
import type { FlatRow } from "./types";
import Spinner from "../Spinner";
import { Skeleton } from "@mui/material";

interface RowItemProps {
  row: FlatRow;
  index: number;
  isSelected: boolean;
  iTrackId: number | null;
  activeSessionStarts: Record<number, number>;
  setITrackId: React.Dispatch<React.SetStateAction<number | null>>;
  setSelectedTracks: React.Dispatch<React.SetStateAction<Set<number>>>;
}

const RowItem = ({
  row,
  index,
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

  const bgColor = () => {
    if (isEventSubRow)
      return isActive || isEventWithActiveParent
        ? Colors.blushWhite
        : "transparent";
    if (isActive) return Colors.vividOrange;
    return "transparent";
  };
  const bgColorNumber = () => {
    if (isEventSubRow)
      return isActive || isEventWithActiveParent ? Colors.white : Colors.white;
    if (isActive) return Colors.white;
    return Colors.vividOrange;
  };

  const textColorNumber = () => {
    if (isEventSubRow) return Colors.white;
    if (isActive) return Colors.vividOrange;
    return Colors.white;
  };

  const textColor = () => {
    if (isEventSubRow) return Colors.lightBlack;
    if (isActive) return Colors.white;
    return Colors.lightBlack;
  };

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
        height: "20px",
        lineHeight: 1.43,
        fontWeight: 400,
        backgroundColor: bgColor,
        color: textColor,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        borderBottom: `1px solid ${Colors.lightGrayishBlue}`,
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
            padding: "0 10px 0 0",
          }}
        >
          <span style={{ marginTop: "2px" }}>{row.cameraNumber}</span>
        </Box>
      )}
      <Box
        sx={{
          bgcolor: bgColorNumber,
          color: textColorNumber,
          height: "20px",
          width: "20px",
          textAlign: "center",
          borderRadius: "50px",
          fontSize: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWidth: 700,
          lineHeight: 1.5,
        }}
      >
        {index}
      </Box>
      <Box
        component="span"
        title={row.name}
        sx={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flex: 1,
          minWidth: 0,
        }}
      >
        {row.name}
      </Box>
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
  loadState?: boolean;
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
  loadState,
}: TimelineRowListProps) => {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "260px",
        background: Colors.white,
        display: "flex",
        flexDirection: "column",
        zIndex: 1,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "28px",
          width: "100%",
          maxWidth: "260px",
          minWidth: "180px",
          padding: "0 4px 0 8px",
          borderBottom: `1px solid ${Colors.lightGrayishBlue}`,
        }}
      >
        <p
          style={{
            textTransform: "capitalize",
            fontFamily: Fonts.main,
            fontSize: 12,
            color: Colors.charcoalNavy,
            lineHeight: 1.5,
            margin: 0,
            fontWeight: 500,
            height: "18px",
          }}
        >
          {headerLabel ? (
            headerLabel
          ) : (
            <>
              <Skeleton width={"150px"} height={"20px"} variant="text" />
            </>
          )}
        </p>
        <Box sx={{ cursor: "pointer", ml: "3px" }} onClick={onOpenDialog}>
          {/* <img src="../assets/plus-1.svg" alt="Add row" /> */}
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
        {flatRows.map((row, i) => (
          <RowItem
            key={row.id}
            row={row}
            index={i + 1}
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
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            {!loadState ? (
              "Empty"
            ) : (
              <>
                <Spinner m="20px" />
                loading...
              </>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

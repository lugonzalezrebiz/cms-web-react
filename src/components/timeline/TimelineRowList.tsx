import { Box } from "@mui/system";
import { Colors, Fonts } from "../../theme";
import type { FlatRow } from "./types";
import Spinner from "../Spinner";
import { Skeleton } from "@mui/material";
import { assetUrl } from "../../utils";

interface RowItemProps {
  row: FlatRow;
  index: number;
  isSelected: boolean;
  iTrackId: number | null;
  activeSessionStarts: Record<number, number>;
  setITrackId: React.Dispatch<React.SetStateAction<number | null>>;
  setSelectedTracks: React.Dispatch<React.SetStateAction<Set<number>>>;
  isSubSelected: boolean;
  /** One of this line's sub-rows is the picked one. */
  isChildPicked: boolean;
  onSelectSubRow?: (rowId: number) => void;
}

const RowItem = ({
  row,
  index,
  isSelected,
  iTrackId,
  activeSessionStarts,
  setITrackId,
  setSelectedTracks,
  isSubSelected,
  isChildPicked,
  onSelectSubRow,
}: RowItemProps) => {
  const isEventSubRow = row.kind === "event";
  const isActivityRow = row.kind === "activity";

  const isEventWithActiveParent =
    row.kind === "event" &&
    row.parentCameraId !== undefined &&
    iTrackId === row.parentCameraId;

  // With one of its sub-rows picked, only that sub-row reads as selected.
  const isFocused = iTrackId === row.id && !isChildPicked;

  const isActive = (isSelected || isFocused) && !isChildPicked;

  // Punches tabs: an open sub-row (customer group) can be sub-selected.
  const isSubSelectable =
    isEventSubRow &&
    onSelectSubRow !== undefined &&
    activeSessionStarts[row.id] !== undefined;

  const handleClick = isEventSubRow
    ? isSubSelectable
      ? () => onSelectSubRow(row.id)
      : undefined
    : row.inactive
      ? // Inactive (greyed-out) lines can't be selected.
        undefined
      : () => {
          setITrackId(row.id);
          if (activeSessionStarts[row.id] !== undefined) {
            setSelectedTracks(new Set([row.id]));
          } else {
            setSelectedTracks(new Set());
          }
        };

  // Customer punches groups: no number, name aligned with the parent's name.
  const isCustomerSubRow = isEventSubRow && row.category === "customers";

  const bgColor = () => {
    // Customer groups are white; only the selected one gets the cream tint.
    if (isCustomerSubRow) return isSubSelected ? Colors.blushWhite : "transparent";
    if (isEventSubRow && isSubSelected) return Colors.transparentVividOrange;
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
    if (row.inactive) return Colors.silverGrey;
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
    // Inactive rows are greyed out (badge and name) until selected.
    if (row.inactive) return Colors.dimGray;
    return Colors.lightBlack;
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: isEventSubRow ? 0 : 1.5,
        // A customer group's name starts where its parent's does (8px
        // padding + 20px number + 12px gap).
        pl: isCustomerSubRow ? "40px" : isEventSubRow ? "50px" : "8px",
        pr: "8px",
        py: "6px",
        cursor: row.inactive ? "default" : "pointer",
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
        transition: "background-color 150ms ease, color 150ms ease",
      }}
    >
      {!isEventSubRow &&
        !isActivityRow &&
        row.category !== "employees" &&
        row.category !== "customers" && (
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
          // Customer groups carry no number.
          display: isCustomerSubRow ? "none" : "flex",
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
  emptyMessage?: React.ReactNode;
  showAddButton?: boolean;
  /** Punches tabs: the picked sub-row (↑/↓, click), with the cream tint. */
  highlightedSubRowId?: number | null;
  /** Punches tabs: clicking an open sub-row sub-selects it. */
  onSelectSubRow?: (rowId: number) => void;
  /** Number shown on the first row (and its digit shortcut); default 1. */
  rowNumberStart?: number;
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
  emptyMessage = "Empty",
  showAddButton = false,
  highlightedSubRowId,
  onSelectSubRow,
  rowNumberStart = 1,
}: TimelineRowListProps) => {
  // The line whose sub-row is picked: it stays the context, but only the
  // sub-row looks selected.
  const pickedParentId =
    highlightedSubRowId != null
      ? flatRows.find((r) => r.id === highlightedSubRowId)?.parentCameraId
      : undefined;

  // Sub-rows (kind "event") don't take a number, so the numbers shown match
  // the digit shortcuts, which only cycle through the selectable rows.
  const rowNumbers = new Map<number, number>();
  let position = 0;
  for (const row of flatRows) {
    if (row.kind !== "event") rowNumbers.set(row.id, position++);
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "245px",
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
          maxWidth: "245px",
          minWidth: "180px",
          padding: "0 8px",
          boxSizing: "border-box",
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
        {showAddButton && (
          <Box
            sx={{ cursor: "pointer", display: "flex", flexShrink: 0 }}
            onClick={onOpenDialog}
          >
            <img src={assetUrl("plus-1.svg")} alt="Add row" />
          </Box>
        )}
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
            index={(rowNumbers.get(row.id) ?? 0) + rowNumberStart}
            isSelected={selectedTracks.has(row.id)}
            iTrackId={iTrackId}
            activeSessionStarts={activeSessionStarts}
            setITrackId={setITrackId}
            setSelectedTracks={setSelectedTracks}
            isSubSelected={row.id === highlightedSubRowId}
            isChildPicked={row.id === pickedParentId}
            onSelectSubRow={onSelectSubRow}
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
              emptyMessage
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

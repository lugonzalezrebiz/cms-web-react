import { useEffect } from "react";
import type { FlatRow } from "../types";

interface UseTimelineKeyboardParams {
  isTunnel: boolean;
  selectableRows: FlatRow[];
  iTrackId: number | null;
  setITrackId: React.Dispatch<React.SetStateAction<number | null>>;
  activeSessionStarts: Record<number, number>;
  setActiveSessionStarts: React.Dispatch<
    React.SetStateAction<Record<number, number>>
  >;
  markerSec: number | null;
  timelineStartSec: number;
  timelineEndSec: number;
  selectedTracks: Set<number>;
  setSelectedTracks: React.Dispatch<React.SetStateAction<Set<number>>>;
  setCompletedSessions: React.Dispatch<
    React.SetStateAction<Record<number, { start: number; end: number }[]>>
  >;
  setMarkerSec: React.Dispatch<React.SetStateAction<number | null>>;
  setShowPunchOut: React.Dispatch<React.SetStateAction<boolean>>;
  punchOutTimerRef: React.MutableRefObject<
    ReturnType<typeof setTimeout> | null
  >;
}

export const useTimelineKeyboard = ({
  isTunnel,
  selectableRows,
  iTrackId,
  setITrackId,
  activeSessionStarts,
  setActiveSessionStarts,
  markerSec,
  timelineStartSec,
  timelineEndSec,
  selectedTracks,
  setSelectedTracks,
  setCompletedSessions,
  setMarkerSec,
  setShowPunchOut,
  punchOutTimerRef,
}: UseTimelineKeyboardParams) => {
  // ── "i" (punch-in cycle) and "o" (punch-out all) ────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditable = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if (isEditable) return;
      if (e.key === "i") {
        if (iTrackId === null) return;
        const currentMarker = markerSec ?? timelineStartSec;

        if (activeSessionStarts[iTrackId] !== undefined) {
          // Already building → deselect current (keep building), advance focus to next
          setSelectedTracks((prev) => {
            const next = new Set(prev);
            next.delete(iTrackId);
            return next;
          });

          const currentIndex = selectableRows.findIndex((r) => r.id === iTrackId);
          const nextIndex = (currentIndex + 1) % selectableRows.length;
          const nextTrack = selectableRows[nextIndex]?.id ?? null;
          setITrackId(nextTrack);

          // Select next track (re-select if already building); building starts on next "i"
          if (nextTrack !== null) {
            setSelectedTracks(new Set([nextTrack]));
          }
        } else {
          // Not yet building → start session for focused track (single selection)
          setSelectedTracks(new Set([iTrackId]));
          setActiveSessionStarts((prev) => ({
            ...prev,
            [iTrackId]: currentMarker,
          }));
        }
      } else if (e.key === "o") {
        const currentMarker = markerSec ?? timelineStartSec;
        // Compute which selected tracks can be completed
        const completedIds = Object.entries(activeSessionStarts)
          .filter(([idStr, sessionStart]) =>
            selectedTracks.has(Number(idStr)) && currentMarker > sessionStart,
          )
          .map(([idStr]) => Number(idStr));

        if (completedIds.length > 0) {
          setCompletedSessions((prev) => {
            const updates = { ...prev };
            for (const id of completedIds) {
              updates[id] = [
                ...(prev[id] ?? []),
                { start: activeSessionStarts[id], end: currentMarker },
              ];
            }
            return updates;
          });
          setShowPunchOut(true);
          if (punchOutTimerRef.current) clearTimeout(punchOutTimerRef.current);
          punchOutTimerRef.current = setTimeout(
            () => setShowPunchOut(false),
            1000,
          );
          setSelectedTracks(new Set());
          setActiveSessionStarts((prev) => {
            const next = { ...prev };
            for (const id of completedIds) delete next[id];
            return next;
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isTunnel,
    selectableRows,
    iTrackId,
    activeSessionStarts,
    markerSec,
    timelineStartSec,
    setITrackId,
    setActiveSessionStarts,
    setSelectedTracks,
    setCompletedSessions,
    setShowPunchOut,
    punchOutTimerRef,
  ]);

  // ── Arrow keys: move marker ──────────────────────────────────────────────
  useEffect(() => {
    const step = 60;

    const handleArrow = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditable = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if (isEditable) return;
      if (selectedTracks.size > 0) {
        if (e.key !== "ArrowRight") return;
      } else {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      }
      e.preventDefault();
      const delta = e.key === "ArrowRight" ? step : -step;
      setMarkerSec((prev) => {
        const base = prev ?? timelineStartSec;
        return Math.max(
          timelineStartSec,
          Math.min(timelineEndSec, base + delta),
        );
      });
    };

    window.addEventListener("keydown", handleArrow);
    return () => window.removeEventListener("keydown", handleArrow);
  }, [selectedTracks, timelineStartSec, timelineEndSec, setMarkerSec]);
};

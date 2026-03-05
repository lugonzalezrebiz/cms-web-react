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
      if (isTunnel && e.key === "i") return;
      if (e.key === "i") {
        const currentMarker = markerSec ?? timelineStartSec;

        // Complete the current i-cycled track's session
        if (iTrackId !== null) {
          const sessionStart = activeSessionStarts[iTrackId];
          if (sessionStart !== undefined) {
            setCompletedSessions((prev) => ({
              ...prev,
              [iTrackId]: [
                ...(prev[iTrackId] ?? []),
                { start: sessionStart, end: currentMarker },
              ],
            }));
          }
          setActiveSessionStarts((prev) => {
            const next = { ...prev };
            delete next[iTrackId];
            return next;
          });
          setSelectedTracks((prev) => {
            const next = new Set(prev);
            next.delete(iTrackId);
            return next;
          });
        }

        // Advance to next track in cycle
        const nextTrack = (() => {
          if (selectableRows.length === 0) return null;
          if (iTrackId === null) return selectableRows[0].id;
          const currentIndex = selectableRows.findIndex(
            (r) => r.id === iTrackId,
          );
          const nextIndex = (currentIndex + 1) % selectableRows.length;
          return selectableRows[nextIndex].id;
        })();

        setITrackId(nextTrack);
        if (nextTrack !== null) {
          setSelectedTracks((prev) => {
            const next = new Set(prev);
            next.add(nextTrack);
            return next;
          });
          setActiveSessionStarts((prev) => ({
            ...prev,
            [nextTrack]: currentMarker,
          }));
        }
      } else if (e.key === "o") {
        const currentMarker = markerSec ?? timelineStartSec;
        // Complete ALL active sessions simultaneously
        setCompletedSessions((prev) => {
          const updates = { ...prev };
          for (const [idStr, sessionStart] of Object.entries(
            activeSessionStarts,
          )) {
            const id = Number(idStr);
            if (currentMarker > sessionStart) {
              updates[id] = [
                ...(prev[id] ?? []),
                { start: sessionStart, end: currentMarker },
              ];
            }
          }
          return updates;
        });
        if (Object.keys(activeSessionStarts).length > 0) {
          setShowPunchOut(true);
          if (punchOutTimerRef.current) clearTimeout(punchOutTimerRef.current);
          punchOutTimerRef.current = setTimeout(
            () => setShowPunchOut(false),
            1000,
          );
        }
        setITrackId(null);
        setSelectedTracks(new Set());
        setActiveSessionStarts({});
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

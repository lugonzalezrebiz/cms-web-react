import { useEffect } from "react";

interface UseWheelZoomPanArgs {
  gridRef: React.RefObject<HTMLDivElement | null>;
  rowsScrollRef: React.RefObject<HTMLDivElement | null>;
  listBodyRef: React.RefObject<HTMLDivElement | null>;
  zoom: number;
  panOffsetSec: number;
  totalSec: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  setPanOffsetSec: React.Dispatch<React.SetStateAction<number>>;
}

export const useWheelZoomPan = ({
  gridRef,
  rowsScrollRef,
  listBodyRef,
  zoom,
  panOffsetSec,
  totalSec,
  setZoom,
  setPanOffsetSec,
}: UseWheelZoomPanArgs) => {
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const width = rect.width;

        const oldZoom = zoom;
        const newZoom = Math.min(8, Math.max(1, oldZoom + (e.deltaY > 0 ? -0.2 : 0.2)));
        if (newZoom === oldZoom) return;

        const oldVisibleDuration = totalSec / oldZoom;
        const newVisibleDuration = totalSec / newZoom;
        const cursorTime = panOffsetSec + (mouseX / width) * oldVisibleDuration;
        let newOffset = cursorTime - (mouseX / width) * newVisibleDuration;
        newOffset = Math.max(0, Math.min(totalSec - newVisibleDuration, newOffset));

        setZoom(newZoom);
        setPanOffsetSec(newOffset);
      } else {
        if (listBodyRef.current) {
          listBodyRef.current.scrollTop += e.deltaY;
          if (rowsScrollRef.current) {
            rowsScrollRef.current.scrollTop = listBodyRef.current.scrollTop;
          }
        }
        if (e.deltaX !== 0) {
          const maxOffset = totalSec - totalSec / zoom;
          setPanOffsetSec((prev) =>
            Math.max(0, Math.min(maxOffset, prev + e.deltaX * 5)),
          );
        }
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [zoom, panOffsetSec, totalSec, setZoom, setPanOffsetSec, gridRef, listBodyRef, rowsScrollRef]);
};

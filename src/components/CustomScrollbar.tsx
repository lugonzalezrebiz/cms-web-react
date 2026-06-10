import { useState, useEffect, useRef, useCallback, forwardRef } from "react";
import { Box } from "@mui/system";
import type { SxProps } from "@mui/system";
import { Colors } from "../theme";

interface CustomScrollbarYProps {
  children: React.ReactNode;
  height: string | number;
  thumbLength?: number;
  bottom?: number;
  top?: number;
  sx?: SxProps;
  contentSx?: SxProps;
  scrollX?: boolean;
  xThumbLength?: number;
}

export const CustomScrollbarY = forwardRef<
  HTMLDivElement,
  CustomScrollbarYProps
>(
  (
    {
      children,
      height,
      thumbLength = 12,
      sx,
      contentSx,
      top,
      bottom,
      scrollX = false,
      xThumbLength = 12,
    },
    forwardedRef,
  ) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const setScrollRef = (el: HTMLDivElement | null) => {
      (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      if (typeof forwardedRef === "function") forwardedRef(el);
      else if (forwardedRef) forwardedRef.current = el;
    };

    const trackRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    const xTrackRef = useRef<HTMLDivElement>(null);
    const xThumbRef = useRef<HTMLDivElement>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [isXDragging, setIsXDragging] = useState(false);
    const [hasScroll, setHasScroll] = useState(false);
    const [hasXScroll, setHasXScroll] = useState(false);

    const dragStartY = useRef(0);
    const dragStartScrollTop = useRef(0);
    const xDragStartX = useRef(0);
    const xDragStartScrollLeft = useRef(0);

    const updateThumb = useCallback(() => {
      const el = scrollRef.current;
      if (!el) return;
      const scrollable = el.scrollHeight - el.clientHeight;
      setHasScroll(scrollable > 0);
      const track = trackRef.current;
      const thumb = thumbRef.current;
      if (track && thumb) {
        const trackH = track.clientHeight - thumbLength;
        const ratio =
          scrollable > 0
            ? Math.min(1, Math.max(0, el.scrollTop / scrollable))
            : 0;
        thumb.style.top = `${ratio * trackH}px`;
      }
    }, [thumbLength]);

    const updateXThumb = useCallback(() => {
      if (!scrollX) return;
      const el = scrollRef.current;
      if (!el) return;
      const scrollable = el.scrollWidth - el.clientWidth;
      setHasXScroll(scrollable > 0);
      const track = xTrackRef.current;
      const thumb = xThumbRef.current;
      if (track && thumb) {
        const trackW = track.clientWidth - xThumbLength;
        const ratio =
          scrollable > 0
            ? Math.min(1, Math.max(0, el.scrollLeft / scrollable))
            : 0;
        thumb.style.left = `${ratio * trackW}px`;
      }
    }, [scrollX, xThumbLength]);

    useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;
      updateThumb();
      updateXThumb();
      const ro = new ResizeObserver(() => {
        updateThumb();
        updateXThumb();
      });
      ro.observe(el);
      if (el.firstElementChild) ro.observe(el.firstElementChild);
      return () => ro.disconnect();
    }, [updateThumb, updateXThumb]);

    // Re-run after hasScroll/hasXScroll state changes: those toggle pr/pb padding
    // which changes scrollWidth/scrollHeight, and also mount the track elements
    // that were absent during the first updateXThumb/updateThumb call.
    useEffect(() => {
      updateThumb();
      updateXThumb();
    }, [hasScroll, hasXScroll, updateThumb, updateXThumb]);

    useEffect(() => {
      if (!isDragging) return;
      const onMove = (e: MouseEvent) => {
        const el = scrollRef.current;
        if (!el) return;
        const delta = e.clientY - dragStartY.current;
        el.scrollTop =
          dragStartScrollTop.current +
          delta * (el.scrollHeight / el.clientHeight);
      };
      const onUp = () => setIsDragging(false);
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      return () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
    }, [isDragging]);

    useEffect(() => {
      if (!isXDragging) return;
      const onMove = (e: MouseEvent) => {
        const el = scrollRef.current;
        if (!el) return;
        const delta = e.clientX - xDragStartX.current;
        el.scrollLeft =
          xDragStartScrollLeft.current +
          delta * (el.scrollWidth / el.clientWidth);
      };
      const onUp = () => setIsXDragging(false);
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      return () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
    }, [isXDragging]);

    const trackBottom = bottom ?? -7;

    return (
      <Box
        sx={{
          position: "relative",
          maxHeight: height,
          ...sx,
        }}
      >
        <Box
          ref={setScrollRef}
          onScroll={() => {
            updateThumb();
            updateXThumb();
          }}
          sx={{
            overflowY: "auto",
            overflowX: scrollX ? "auto" : "hidden",
            pr: hasScroll ? "20px" : 0,
            pb: scrollX && hasXScroll ? "20px" : 0,
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
            ...contentSx,
          }}
        >
          {children}
        </Box>

        {hasScroll && (
          <Box
            ref={trackRef}
            sx={{
              position: "absolute",
              right: 0,
              top: top ?? 0,
              bottom: scrollX && hasXScroll ? 12 : trackBottom,
              width: 10,
              background: Colors.blushWhite,
              borderRadius: "8px",
              border: `1px solid ${Colors.charcoalNavy}`,
              overflow: "hidden",
            }}
          >
            <Box
              ref={thumbRef}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsDragging(true);
                dragStartY.current = e.clientY;
                dragStartScrollTop.current = scrollRef.current?.scrollTop ?? 0;
              }}
              sx={{
                position: "absolute",
                top: 0,
                width: 10,
                height: thumbLength,
                left: "50%",
                transform: "translateX(-50%)",
                background: isDragging
                  ? Colors.orangeHover
                  : Colors.vividOrange,
                borderRadius: thumbLength > 12 ? "6px" : "50%",
                cursor: isDragging ? "grabbing" : "grab",
                transition: "background 0.15s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
              }}
            />
          </Box>
        )}

        {scrollX && hasXScroll && (
          <Box
            ref={xTrackRef}
            sx={{
              position: "absolute",
              bottom: trackBottom,
              left: 0,
              right: hasScroll ? 12 : 0,
              height: 10,
              background: Colors.blushWhite,
              borderRadius: "8px",
              border: `1px solid ${Colors.charcoalNavy}`,
              overflow: "hidden",
            }}
          >
            <Box
              ref={xThumbRef}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsXDragging(true);
                xDragStartX.current = e.clientX;
                xDragStartScrollLeft.current =
                  scrollRef.current?.scrollLeft ?? 0;
              }}
              sx={{
                position: "absolute",
                left: 0,
                height: 10,
                width: xThumbLength,
                top: "50%",
                transform: "translateY(-50%)",
                background: isXDragging
                  ? Colors.orangeHover
                  : Colors.vividOrange,
                borderRadius: xThumbLength > 12 ? "6px" : "50%",
                cursor: isXDragging ? "grabbing" : "grab",
                transition: "background 0.15s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
              }}
            />
          </Box>
        )}
      </Box>
    );
  },
);

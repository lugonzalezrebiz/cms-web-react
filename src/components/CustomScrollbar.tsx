import { useState, useEffect, useRef, useCallback } from "react";
import { Box } from "@mui/system";
import type { SxProps } from "@mui/system";
import { Colors } from "../theme";

interface CustomScrollbarProps {
  children: React.ReactNode;
  height: string | number;
  thumbLength?: number;
  bottom?: number;
  top?: number;
  sx?: SxProps;
  contentSx?: SxProps;
}

const CustomScrollbar = ({
  children,
  height,
  thumbLength = 12,
  sx,
  contentSx,
  top,
  bottom,
}: CustomScrollbarProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasScroll, setHasScroll] = useState(false);
  const dragStartY = useRef(0);
  const dragStartScrollTop = useRef(0);

  const updateThumb = useCallback(() => {
    const el = scrollRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!el) return;
    const scrollable = el.scrollHeight - el.clientHeight;
    setHasScroll(scrollable > 0);
    if (!track || !thumb) return;
    const trackHeight = track.clientHeight - thumbLength;
    const top = scrollable > 0 ? (el.scrollTop / scrollable) * trackHeight : 0;
    thumb.style.top = `${top}px`;
  }, [thumbLength]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateThumb();
    const ro = new ResizeObserver(updateThumb);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateThumb]);

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

  return (
    <Box sx={{ position: "relative", height, ...sx }}>
      <Box
        ref={scrollRef}
        onScroll={updateThumb}
        sx={{
          height: "100%",
          overflowY: "auto",
          pr: hasScroll ? "20px" : 0,
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          ...contentSx,
        }}
      >
        {children}
      </Box>
      {/* Track */}
      {hasScroll && <Box
        ref={trackRef}
        sx={{
          position: "absolute",
          right: 0,
          top: top ? top : 0,
          bottom: bottom ? bottom : -7,
          width: 10,
          background: Colors.blushWhite,
          borderRadius: "8px",
          border: `1px solid ${Colors.charcoalNavy}`,
        }}
      >
        {/* Thumb */}
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
            background: isDragging ? Colors.orangeHover : Colors.vividOrange,
            borderRadius: thumbLength > 12 ? "6px" : "50%",
            cursor: isDragging ? "grabbing" : "grab",
            transition: "background 0.15s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
          }}
        />
      </Box>}
    </Box>
  );
};

export default CustomScrollbar;

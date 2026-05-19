import { Box } from "@mui/system";
import { Colors } from "../../../theme";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import type React from "react";
import type { FlatRow, CameraEventPoint, SetResizing } from "../types";

const ROW_HEIGHT = 44;
const DIAMOND_SIZE = 14;
const BAR_HEIGHT = 15;
const BAR_RADIUS = 8;
const TRANSITION_MS = 150;

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

function colorAlpha(hex: string, alphaByte: string): string {
  const h = hex.startsWith("#") ? hex.slice(1) : hex;
  const full = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h;
  return "#" + full + alphaByte;
}

function lerpHexAlpha(
  hex: string,
  fromA: number,
  toA: number,
  t: number,
): string {
  const a = Math.round(fromA + (toA - fromA) * t);
  return colorAlpha(hex, a.toString(16).padStart(2, "0"));
}

function formatSec(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Canvas drawing primitives
// ---------------------------------------------------------------------------

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const cr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + cr, y);
  ctx.arcTo(x + w, y, x + w, y + h, cr);
  ctx.arcTo(x + w, y + h, x, y + h, cr);
  ctx.arcTo(x, y + h, x, y, cr);
  ctx.arcTo(x, y, x + w, y, cr);
  ctx.closePath();
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  fillColor: string,
  outlineWidth: number,
  shadowColor: string | null,
  shadowBlur: number,
) {
  const half = size / 2;
  ctx.save();
  ctx.shadowColor = shadowColor ?? "transparent";
  ctx.shadowBlur = shadowColor ? shadowBlur : 0;
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.rect(-half, -half, size, size);
  ctx.fill();
  // stroke without shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = outlineWidth;
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Hit testing
// ---------------------------------------------------------------------------

function hitDiamond(
  px: number,
  py: number,
  cx: number,
  cy: number,
  size: number,
): boolean {
  return Math.abs(px - cx) + Math.abs(py - cy) <= size / Math.SQRT2 + 3;
}

function hitBar(
  px: number,
  py: number,
  x: number,
  y: number,
  w: number,
  h: number,
): boolean {
  return px >= x && px <= x + w && py >= y && py <= y + h;
}

// ---------------------------------------------------------------------------
// Animated frame draw
// animProgress: 0 = fully settled on fromId, 1 = fully settled on toId
// ---------------------------------------------------------------------------

interface AnimState {
  fromId: number | null;
  toId: number | null;
  animProgress: number;
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  points: CameraEventPoint[],
  visibleStart: number,
  visibleEnd: number,
  visibleDuration: number,
  anim: AnimState,
  editingId: number | null,
) {
  ctx.clearRect(0, 0, width, height);
  const cy = height / 2;
  const toSecX = (sec: number) =>
    ((sec - visibleStart) / visibleDuration) * width;

  // Draw order: unreviewed-bars → unreviewed-diamonds → reviewed-bars → reviewed-diamonds
  // Within each group: unselected before selected
  const groups: [boolean, "bars" | "diamonds"][] = [
    [false, "bars"],
    [false, "diamonds"],
    [true, "bars"],
    [true, "diamonds"],
  ];
  for (const [passReviewed, pass] of groups) {
    for (const selPass of [false, true] as const) {
      for (const ep of points) {
        if (ep.reviewed !== passReviewed) continue;
        const isSelected = ep.id === anim.toId;
        if (isSelected !== selPass) continue;

        const entering = ep.id === anim.toId;
        const leaving = ep.id === anim.fromId;

        // t = visual selection progress for this ep
        const t = entering
          ? anim.animProgress
          : leaving
            ? 1 - anim.animProgress
            : isSelected
              ? 1
              : 0;

        const isEditing = ep.id === editingId;
        const activeColor = isEditing
          ? Colors.vividOrange
          : ep.reviewed
            ? Colors.vividOrange
            : Colors.blue;
        const idleColor = isEditing
          ? Colors.lightOrange
          : ep.reviewed
            ? Colors.lightOrange
            : Colors.lightSkyBlue;
        const shadowColor = t > 0 ? colorAlpha(activeColor, "99") : null;
        const shadowBlur = t * 10;

        if (pass === "bars") {
          const barStart = Math.max(ep.startSec, visibleStart);
          const barEnd = Math.min(ep.endSec, visibleEnd);
          if (barStart >= barEnd) continue;

          const leftPx = toSecX(ep.startSec) + (0.28 / 100) * width;
          const widthPx = ((ep.endSec - ep.startSec) / visibleDuration) * width;
          const widthPct = (widthPx / width) * 100;
          // Interpolate bar fill: 0x55 (unselected) ↔ 0x99 (selected)
          const barFill = lerpHexAlpha(activeColor, 0x55, 0x99, t);

          ctx.save();
          if (t > 0) {
            ctx.shadowColor = colorAlpha(idleColor, "99");
            ctx.shadowBlur = t * 12;
          }
          drawRoundedRect(
            ctx,
            leftPx,
            cy - BAR_HEIGHT / 2,
            widthPx,
            BAR_HEIGHT,
            BAR_RADIUS,
          );
          ctx.fillStyle = widthPct <= 1.3 ? "transparent" : barFill;
          ctx.fill();
          ctx.restore();
        } else {
          const fillColor = isSelected ? activeColor : idleColor;
          const outlineWidth = isSelected ? 1.5 : 1;

          if (ep.timeSec >= visibleStart && ep.timeSec <= visibleEnd) {
            drawDiamond(
              ctx,
              toSecX(ep.timeSec),
              cy,
              DIAMOND_SIZE,
              fillColor,
              outlineWidth,
              shadowColor,
              shadowBlur,
            );
          }
          if (
            ep.mode === "RANGE" &&
            ep.endSec > ep.timeSec &&
            ep.endSec >= visibleStart &&
            ep.endSec <= visibleEnd
          ) {
            drawDiamond(
              ctx,
              toSecX(ep.endSec),
              cy,
              DIAMOND_SIZE,
              fillColor,
              outlineWidth,
              shadowColor,
              shadowBlur,
            );
          }
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// EventRow
// ---------------------------------------------------------------------------

export interface EventRowProps {
  row: FlatRow;
  rowIndex: number;
  cameraEventPoints: CameraEventPoint[];
  visibleStart: number;
  visibleEnd: number;
  visibleDuration: number;
  setResizing: SetResizing;
  setMarkerSec: React.Dispatch<React.SetStateAction<number | null>>;
  setITrackId: React.Dispatch<React.SetStateAction<number | null>>;
  selectedEventPointId: number | null;
  setSelectedEventPointId: React.Dispatch<React.SetStateAction<number | null>>;
  onExtendStart: (epId: number, e: React.MouseEvent, minSec: number) => void;
  onConvertEventPointToLocal?: (id: number) => number;
  onEnterEditMode?: (id: number) => void;
  editingEventPointId: number | null;
  onExitEditMode: () => void;
  onStartMove: (epId: number, e: React.MouseEvent, maxSec: number) => void;
  onEditEventPoint?: (id: number) => void;
}

export const EventRow = memo(
  ({
    row,
    rowIndex,
    cameraEventPoints,
    visibleStart,
    visibleEnd,
    visibleDuration,
    setMarkerSec,
    setITrackId,
    selectedEventPointId,
    setSelectedEventPointId,
    onExtendStart,
    onConvertEventPointToLocal,
    onEnterEditMode,
    editingEventPointId,
    onExitEditMode,
    onStartMove,
    onEditEventPoint,
  }: EventRowProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Mutable draw state — updated synchronously, read by RAF
    const stateRef = useRef({
      points: [] as CameraEventPoint[],
      visibleStart: 0,
      visibleEnd: 0,
      visibleDuration: 1,
      selectedId: null as number | null,
      prevSelectedId: null as number | null,
      editingId: null as number | null,
      animating: false,
      animStartTime: 0,
      rafId: 0,
    });

    const points = useMemo(
      () =>
        (row.kind === "activity"
          ? cameraEventPoints.filter((ep) => ep.label === row.name)
          : cameraEventPoints.filter(
              (ep) =>
                ep.cameraId === row.parentCameraId && ep.label === row.name,
            )
        ).sort((a, b) => Number(a.reviewed) - Number(b.reviewed)),
      [cameraEventPoints, row.kind, row.name, row.parentCameraId],
    );

    // -------------------------------------------------------------------------
    // RAF draw loop — scheduleFrameRef avoids self-reference before declaration
    // -------------------------------------------------------------------------
    const scheduleFrameRef = useRef<() => void>(() => {});

    const scheduleFrame = useCallback(() => {
      const s = stateRef.current;
      if (s.rafId) return;
      s.rafId = requestAnimationFrame(() => {
        s.rafId = 0;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        if (w === 0 || h === 0) {
          scheduleFrameRef.current();
          return;
        }

        const needW = Math.round(w * dpr);
        const needH = Math.round(h * dpr);
        if (canvas.width !== needW || canvas.height !== needH) {
          canvas.width = needW;
          canvas.height = needH;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        let animProgress = 1;
        if (s.animating) {
          const elapsed = performance.now() - s.animStartTime;
          animProgress = Math.min(elapsed / TRANSITION_MS, 1);
          if (animProgress < 1) scheduleFrameRef.current();
          else {
            s.animating = false;
            s.prevSelectedId = null;
          }
        }

        drawFrame(
          ctx,
          w,
          h,
          s.points,
          s.visibleStart,
          s.visibleEnd,
          s.visibleDuration,
          {
            fromId: s.prevSelectedId,
            toId: s.selectedId,
            animProgress,
          },
          s.editingId,
        );
      });
    }, []);

    useEffect(() => {
      scheduleFrameRef.current = scheduleFrame;
    }, [scheduleFrame]);

    // Cancel RAF only on unmount — not on every re-render.
    // stateRef is always current so any pending RAF will draw the latest data.
    useEffect(() => {
      const s = stateRef.current;
      return () => {
        if (s.rafId) {
          cancelAnimationFrame(s.rafId);
          s.rafId = 0;
        }
      };
    }, []);

    // Sync React state → stateRef, then kick the RAF
    useEffect(() => {
      const s = stateRef.current;
      const prevSelectedId = s.selectedId;

      s.points = points;
      s.visibleStart = visibleStart;
      s.visibleEnd = visibleEnd;
      s.visibleDuration = visibleDuration;
      s.editingId = editingEventPointId;

      if (selectedEventPointId !== prevSelectedId) {
        s.prevSelectedId = prevSelectedId;
        s.selectedId = selectedEventPointId;
        s.animating = true;
        s.animStartTime = performance.now();
      }

      scheduleFrame();
    }, [
      points,
      visibleStart,
      visibleEnd,
      visibleDuration,
      selectedEventPointId,
      editingEventPointId,
      scheduleFrame,
    ]);

    // Redraw when the canvas CSS size changes so the bitmap stays in sync
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ro = new ResizeObserver(() => scheduleFrame());
      ro.observe(canvas);
      return () => ro.disconnect();
    }, [scheduleFrame]);

    // -------------------------------------------------------------------------
    // Hit testing helpers
    // -------------------------------------------------------------------------
    const getHitEp = useCallback(
      (
        px: number,
        py: number,
        w: number,
        h: number,
      ): CameraEventPoint | null => {
        const cy = h / 2;
        const toSecX = (s: number) =>
          ((s - visibleStart) / visibleDuration) * w;
        const reversed = [...points].reverse();

        // Priority mirrors draw order in reverse (last drawn = highest priority):
        // reviewed-diamonds → reviewed-bars → unreviewed-diamonds → unreviewed-bars
        const hitGroups: [boolean, "diamonds" | "bars"][] = [
          [true, "diamonds"],
          [true, "bars"],
          [false, "diamonds"],
          [false, "bars"],
        ];

        for (const [hitReviewed, hitKind] of hitGroups) {
          for (const ep of reversed) {
            if (ep.reviewed !== hitReviewed) continue;
            if (hitKind === "diamonds") {
              if (
                ep.mode === "RANGE" &&
                ep.endSec > ep.timeSec &&
                ep.endSec >= visibleStart &&
                ep.endSec <= visibleEnd
              ) {
                if (hitDiamond(px, py, toSecX(ep.endSec), cy, DIAMOND_SIZE))
                  return ep;
              }
              if (ep.timeSec >= visibleStart && ep.timeSec <= visibleEnd) {
                if (hitDiamond(px, py, toSecX(ep.timeSec), cy, DIAMOND_SIZE))
                  return ep;
              }
            } else {
              const bS = Math.max(ep.startSec, visibleStart);
              const bE = Math.min(ep.endSec, visibleEnd);
              if (bS < bE) {
                const lx = toSecX(ep.startSec);
                const bw = ((ep.endSec - ep.startSec) / visibleDuration) * w;
                if (hitBar(px, py, lx, cy - BAR_HEIGHT / 2, bw, BAR_HEIGHT))
                  return ep;
              }
            }
          }
        }
        return null;
      },
      [points, visibleStart, visibleEnd, visibleDuration],
    );

    const isRangeDragHandle = useCallback(
      (
        ep: CameraEventPoint,
        px: number,
        py: number,
        w: number,
        h: number,
      ): boolean => {
        if (ep.mode !== "RANGE") return false;
        const centerY = h / 2;
        const toSecX = (s: number) =>
          ((s - visibleStart) / visibleDuration) * w;
        if (ep.endSec > ep.timeSec) {
          return (
            ep.endSec >= visibleStart &&
            ep.endSec <= visibleEnd &&
            hitDiamond(px, py, toSecX(ep.endSec), centerY, DIAMOND_SIZE)
          );
        }
        return (
          ep.timeSec >= visibleStart &&
          ep.timeSec <= visibleEnd &&
          hitDiamond(px, py, toSecX(ep.timeSec), centerY, DIAMOND_SIZE)
        );
      },
      [visibleStart, visibleEnd, visibleDuration],
    );

    const selectEp = useCallback(
      (ep: CameraEventPoint) => {
        setMarkerSec(ep.timeSec);
        setSelectedEventPointId(ep.id);
        setITrackId(row.id);
      },
      [setMarkerSec, setSelectedEventPointId, setITrackId, row.id],
    );

    // -------------------------------------------------------------------------
    // 2. Click passthrough — if no hit, re-dispatch to element below canvas
    // -------------------------------------------------------------------------
    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const ep = getHitEp(px, py, rect.width, rect.height);
        if (ep) {
          if (ep.id !== editingEventPointId) onExitEditMode();
          selectEp(ep);
          return;
        }

        onExitEditMode();
        // Pass through to element below
        const canvas = e.currentTarget;
        canvas.style.pointerEvents = "none";
        const below = document.elementFromPoint(e.clientX, e.clientY);
        canvas.style.pointerEvents = "auto";
        if (below && below !== canvas) {
          below.dispatchEvent(
            new MouseEvent("click", {
              bubbles: true,
              cancelable: true,
              clientX: e.clientX,
              clientY: e.clientY,
              button: e.button,
              buttons: e.buttons,
            }),
          );
        }
      },
      [getHitEp, selectEp, editingEventPointId, onExitEditMode],
    );

    const handleDoubleClick = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const ep = getHitEp(px, py, rect.width, rect.height);
        if (ep?.mode === "RANGE" && ep.reviewed) {
          onEditEventPoint?.(ep.id);
        }
      },
      [getHitEp, onEditEventPoint],
    );

    const handleMouseDown = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const cy = rect.height / 2;
        const toSecX = (s: number) =>
          ((s - visibleStart) / visibleDuration) * rect.width;
        for (const ep of [...points].reverse()) {
          // Start diamond is draggable when selected or in edit mode, only when range has width
          const isActivePoint =
            ep.id === editingEventPointId || ep.id === selectedEventPointId;
          if (
            isActivePoint &&
            ep.reviewed &&
            ep.mode === "RANGE" &&
            ep.endSec > ep.timeSec
          ) {
            if (hitDiamond(px, py, toSecX(ep.timeSec), cy, DIAMOND_SIZE)) {
              e.preventDefault();
              e.stopPropagation();
              const targetId = onConvertEventPointToLocal?.(ep.id) ?? ep.id;
              onEnterEditMode?.(targetId);
              onStartMove(targetId, e, ep.endSec);
              return;
            }
          }
          const isSelected = ep.id === selectedEventPointId;
          const isNewLocal = !ep.entryIds && ep.endSec === ep.timeSec;
          if (
            ep.reviewed &&
            (isSelected || isNewLocal) &&
            isRangeDragHandle(ep, px, py, rect.width, rect.height)
          ) {
            e.preventDefault();
            e.stopPropagation();
            const targetId = onConvertEventPointToLocal?.(ep.id) ?? ep.id;
            onEnterEditMode?.(targetId);
            onExtendStart(targetId, e, ep.timeSec);
            return;
          }
        }
      },
      [
        points,
        visibleStart,
        visibleDuration,
        selectedEventPointId,
        editingEventPointId,
        onStartMove,
        isRangeDragHandle,
        onExtendStart,
        onConvertEventPointToLocal,
        onEnterEditMode,
      ],
    );

    // -------------------------------------------------------------------------
    // 3. Cursor management + onMouseLeave reset
    // -------------------------------------------------------------------------
    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const cy = rect.height / 2;
        const toSecX = (s: number) =>
          ((s - visibleStart) / visibleDuration) * rect.width;

        for (const ep of [...points].reverse()) {
          const isActivePoint =
            ep.id === editingEventPointId || ep.id === selectedEventPointId;
          if (
            isActivePoint &&
            ep.reviewed &&
            ep.mode === "RANGE" &&
            ep.endSec > ep.timeSec
          ) {
            if (hitDiamond(px, py, toSecX(ep.timeSec), cy, DIAMOND_SIZE)) {
              e.currentTarget.style.cursor = "ew-resize";
              return;
            }
          }
          const isSelected = ep.id === selectedEventPointId;
          const isNewLocal = !ep.entryIds && ep.endSec === ep.timeSec;
          if (
            ep.reviewed &&
            (isSelected || isNewLocal) &&
            isRangeDragHandle(ep, px, py, rect.width, rect.height)
          ) {
            e.currentTarget.style.cursor = "ew-resize";
            return;
          }
        }
        e.currentTarget.style.cursor = getHitEp(px, py, rect.width, rect.height)
          ? "pointer"
          : "default";
      },
      [
        points,
        visibleStart,
        visibleDuration,
        selectedEventPointId,
        editingEventPointId,
        isRangeDragHandle,
        getHitEp,
      ],
    );

    // 3. Reset cursor when mouse leaves
    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        e.currentTarget.style.cursor = "default";
      },
      [],
    );

    // -------------------------------------------------------------------------
    // 4. Accessibility — visually-hidden button list
    // -------------------------------------------------------------------------
    const a11yStyle: React.CSSProperties = {
      position: "absolute",
      width: 1,
      height: 1,
      padding: 0,
      margin: -1,
      overflow: "hidden",
      clip: "rect(0,0,0,0)",
      whiteSpace: "nowrap",
      border: 0,
    };

    return (
      <Box
        sx={{
          position: "absolute",
          top: rowIndex * ROW_HEIGHT,
          left: 0,
          right: 0,
          height: ROW_HEIGHT,
          pointerEvents: "auto",
        }}
      >
        {/* 5. DevTools: data attribute lists event point IDs for debugging */}
        <canvas
          ref={canvasRef}
          data-row={row.name}
          data-ep-ids={points.map((ep) => ep.id).join(",")}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "block",
            pointerEvents: "auto",
          }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />

        {/* 4. Accessibility layer */}
        <div
          role="list"
          aria-label={`Event points: ${row.name}`}
          style={a11yStyle}
        >
          {points.map((ep) => (
            <div key={ep.id} role="listitem">
              <button
                aria-pressed={selectedEventPointId === ep.id}
                aria-label={`${ep.label ?? row.name} at ${formatSec(ep.timeSec)}, ${ep.reviewed ? "reviewed" : "unreviewed"}`}
                onClick={() => selectEp(ep)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
              />
            </div>
          ))}
        </div>
      </Box>
    );
  },
) as React.FC<EventRowProps>;

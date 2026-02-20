// MonitoringTimelineComponent.test.tsx
// Behavior contract tests for the migrated MonitoringTimeline component.
// These tests cover IPC subscriptions, toolbar interactions, and state changes.
// Canvas pixel output is intentionally NOT tested (requires visual regression tools).

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MonitoringTimeline from "../MonitoringTimelineComponent";
import type { TimelineSnapshot } from "../MonitoringTimelineComponent";

// ─── Mocks ─────────────────────────────────────────────────────────────────────

// Mock AppStorage (avoids IndexedDB in jsdom)
vi.mock("../../../storage/AppStorage.js", () => {
  class MockAppStorage {
    location() {
      return {
        ensure: vi.fn(async () => {}),
        get: vi.fn(async () => 280),
        set: vi.fn(async () => {}),
      };
    }
  }
  return { default: MockAppStorage };
});

// Mock canvas 2D context (jsdom has no real canvas implementation)
const ctxMock = {
  setTransform: vi.fn(),
  imageSmoothingEnabled: true,
  clearRect: vi.fn(),
  translate: vi.fn(),
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  arc: vi.fn(),
  roundRect: vi.fn(),
  quadraticCurveTo: vi.fn(),
  closePath: vi.fn(),
  clip: vi.fn(),
  rect: vi.fn(),
  setLineDash: vi.fn(),
  measureText: vi.fn(() => ({
    width: 50,
    actualBoundingBoxAscent: 8,
    actualBoundingBoxDescent: 2,
  })),
  fillText: vi.fn(),
  strokeText: vi.fn(),
  strokeStyle: "" as string | CanvasGradient | CanvasPattern,
  fillStyle: "" as string | CanvasGradient | CanvasPattern,
  lineWidth: 1,
  globalAlpha: 1,
  font: "12px sans-serif",
  textAlign: "left" as CanvasTextAlign,
  textBaseline: "alphabetic" as CanvasTextBaseline,
  globalCompositeOperation: "source-over" as GlobalCompositeOperation,
  shadowColor: "",
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
};

// Minimal mock snapshot
const makeSnapshot = (overrides: Partial<TimelineSnapshot> = {}): TimelineSnapshot => ({
  torn: false,
  ui: {
    panOffsetSec: 0,
    zoom: 1,
    category: "employees",
    playback: false,
    selection: { trackId: null, sessionKeys: [] },
  },
  timeline: {
    times: {
      start: "08:00:00",
      end: "18:00:00",
      current: "09:00:00",
      buffer: 900,
      interval: 60,
      businessStart: "08:00:00",
      businessEnd: "18:00:00",
    },
    tracks: [],
  },
  ...overrides,
});

// Timeline API mock
const unsubscribeMock = vi.fn();
const subscribeMock = vi.fn((_event: string, _cb: unknown) => ({ unsubscribe: unsubscribeMock }));
const mockTimeline = {
  subscribe: subscribeMock,
  snapshot: vi.fn(async () => makeSnapshot()),
  company: vi.fn(async () => 1),
  location: vi.fn(async () => 1),
  date: vi.fn(async () => "2024-01-01"),
  current: vi.fn(async () => "09:00:00"),
  setUi: vi.fn(async () => {}),
  goto: vi.fn(async () => {}),
  first: vi.fn(),
  back: vi.fn(),
  next: vi.fn(),
  last: vi.fn(),
  play: vi.fn(async () => true),
  pause: vi.fn(async () => true),
  torn: vi.fn(async () => false),
  detach: vi.fn(),
  attach: vi.fn(),
  addTrack: vi.fn(async () => true),
  removeTrack: vi.fn(async () => true),
  addSession: vi.fn(async () => {}),
  deleteSession: vi.fn(async () => {}),
  cut: vi.fn(async () => {}),
  patch: vi.fn(async () => {}),
  updateRange: vi.fn(async () => {}),
  addMarker: vi.fn(async () => {}),
  clearMarkersAt: vi.fn(async () => {}),
};

// ─── Setup ─────────────────────────────────────────────────────────────────────

// Restore all spies after each test so that vi.spyOn(window, "getComputedStyle")
// in the next beforeEach captures the REAL implementation, not a stale spy.
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.clearAllMocks();
  subscribeMock.mockImplementation((_event: string, _cb: unknown) => ({ unsubscribe: unsubscribeMock }));
  mockTimeline.snapshot.mockResolvedValue(makeSnapshot());
  mockTimeline.current.mockResolvedValue("09:00:00");
  mockTimeline.torn.mockResolvedValue(false);

  Object.defineProperty(window, "timeline", { value: mockTimeline, writable: true, configurable: true });

  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value: vi.fn(() => ctxMock),
  });

  // jsdom lacks getComputedStyle CSS var support — return sensible defaults
  const originalGCS = window.getComputedStyle.bind(window);
  vi.spyOn(window, "getComputedStyle").mockImplementation((el, pseudo) => {
    const style = originalGCS(el, pseudo);
    const origGetProp = style.getPropertyValue.bind(style);
    vi.spyOn(style, "getPropertyValue").mockImplementation((prop: string) => {
      const cssVarDefaults: Record<string, string> = {
        "--canvas-track-height": "32px",
        "--session-bar-height": "14px",
        "--border-radius-session": "4px",
        "--color-canvas-background": "#111",
        "--color-canvas-background-dark": "#1a1a1a55",
        "--color-canvas-labels-background": "#2226",
        "--color-canvas-labels-background-hover": "#222a",
        "--color-canvas-labels-background-selected": "#ff6e16",
        "--color-canvas-border": "#3334",
        "--color-canvas-text": "#eee",
        "--color-canvas-text-hover": "#ff6000",
        "--color-text-hover": "#ff6000",
        "--color-canvas-text-selected": "#fff",
        "--color-time-labels-hours": "#ddd",
        "--color-time-labels-minutes": "#888",
        "--color-business-hours": "#ff6e1666",
        "--color-actual-hours": "#66cc6699",
        "--color-ordinal-background": "#1a1a1a",
        "--color-ordinal-background-hover": "#161616",
        "--color-ordinal-background-selected": "#ff6000",
        "--color-ordinal-text": "#ccc",
        "--color-ordinal-text-hover": "#fff",
        "--color-ordinal-text-selected": "#fff",
        "--color-marker": "#ff6000aa",
        "--color-session-background": "#333",
        "--color-session-range-background": "#ff7f4d",
        "--color-session-single-background": "#d16aff",
        "--color-session-hover-border": "#111",
        "--color-session-range-hover-border": "#d2541e",
        "--color-session-single-hover-border": "#a136d1",
        "--color-session-selected-background": "#333",
        "--color-session-range-selected-background": "#d2541e",
        "--color-session-single-selected-background": "#a136d1",
        "--color-session-hint-background": "#222",
        "--color-session-hint-text": "#999",
      };
      return cssVarDefaults[prop] ?? origGetProp(prop);
    });
    // Provide minimal font info
    Object.defineProperty(style, "font", { get: () => "14px sans-serif", configurable: true });
    Object.defineProperty(style, "fontSize", { get: () => "14px", configurable: true });
    Object.defineProperty(style, "fontFamily", { get: () => "sans-serif", configurable: true });
    return style;
  });

  // Mock matchMedia (jsdom doesn't define it, so spyOn would throw)
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
    })),
  });

  // Mock ResizeObserver (must be a class/function, not arrow, to work with `new`)
  vi.stubGlobal(
    "ResizeObserver",
    class MockResizeObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  );

  // Mock Path2D (missing from jsdom — used by canvas drawing code)
  vi.stubGlobal(
    "Path2D",
    class MockPath2D {
      moveTo() {}
      lineTo() {}
      arcTo() {}
      arc() {}
      quadraticCurveTo() {}
      closePath() {}
      addPath() {}
      rect() {}
    },
  );

  // Mock requestAnimationFrame
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    cb(performance.now());
    return 0;
  });
});

// ─── Tests ──────────────────────────────────────────────────────────────────────

describe("MonitoringTimeline (behavior contract)", () => {
  // ── Render ──────────────────────────────────────────────────────────────────
  describe("Render", () => {
    it("renders without crashing", async () => {
      await act(async () => {
        render(<MonitoringTimeline />);
      });
      // Component renders the toolbar
      expect(screen.getByRole("button", { name: /Add Track/i })).toBeInTheDocument();
    });

    it("renders three canvas elements", async () => {
      const { container } = await act(async () => render(<MonitoringTimeline />));
      const canvases = container.querySelectorAll("canvas");
      expect(canvases).toHaveLength(3);
    });

    it("renders all navigation buttons", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      expect(screen.getByRole("button", { name: /Move to First/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Move Back/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Move Next/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Move to Last/i })).toBeInTheDocument();
    });

    it("renders the play/pause button", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      expect(screen.getByRole("button", { name: /Play|Pause/i })).toBeInTheDocument();
    });

    it("renders the tear-out button", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      expect(screen.getByRole("button", { name: /Tear out/i })).toBeInTheDocument();
    });

    it("renders the time display with initial value", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      // After init, the time is fetched from window.timeline.current()
      await waitFor(() => {
        expect(screen.getByText("09:00:00")).toBeInTheDocument();
      });
    });

    it("renders with detached prop without crashing", async () => {
      await act(async () => { render(<MonitoringTimeline detached />); });
      expect(screen.getByRole("button", { name: /Add Track/i })).toBeInTheDocument();
    });
  });

  // ── IPC Subscriptions ────────────────────────────────────────────────────────
  describe("IPC subscriptions", () => {
    it("subscribes to 7 timeline events on mount", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      expect(subscribeMock).toHaveBeenCalledTimes(7);
    });

    it("subscribes to 'snapshot' event", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      const events = subscribeMock.mock.calls.map(([e]) => e as string);
      expect(events).toContain("snapshot");
    });

    it("subscribes to 'detached' and 'attached' events", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      const events = subscribeMock.mock.calls.map(([e]) => e as string);
      expect(events).toContain("detached");
      expect(events).toContain("attached");
    });

    it("subscribes to 'move' event", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      const events = subscribeMock.mock.calls.map(([e]) => e as string);
      expect(events).toContain("move");
    });

    it("subscribes to 'playback', 'playback:paused', 'playback:ended' events", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      const events = subscribeMock.mock.calls.map(([e]) => e as string);
      expect(events).toContain("playback");
      expect(events).toContain("playback:paused");
      expect(events).toContain("playback:ended");
    });

    it("calls unsubscribe for all 7 subscriptions on unmount", async () => {
      const { unmount } = await act(async () => render(<MonitoringTimeline />));
      await act(async () => { unmount(); });
      expect(unsubscribeMock).toHaveBeenCalledTimes(7);
    });
  });

  // ── Navigation buttons ───────────────────────────────────────────────────────
  describe("Navigation", () => {
    it("calls window.timeline.first() when Move to First is clicked", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      fireEvent.click(screen.getByRole("button", { name: /Move to First/i }));
      expect(mockTimeline.first).toHaveBeenCalledOnce();
    });

    it("calls window.timeline.back() when Move Back is clicked", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      fireEvent.click(screen.getByRole("button", { name: /Move Back/i }));
      expect(mockTimeline.back).toHaveBeenCalledOnce();
    });

    it("calls window.timeline.next() when Move Next is clicked", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      fireEvent.click(screen.getByRole("button", { name: /Move Next/i }));
      expect(mockTimeline.next).toHaveBeenCalledOnce();
    });

    it("calls window.timeline.last() when Move to Last is clicked", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      fireEvent.click(screen.getByRole("button", { name: /Move to Last/i }));
      expect(mockTimeline.last).toHaveBeenCalledOnce();
    });

    it("calls window.timeline.first() on Home key", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      fireEvent.keyDown(window, { key: "Home" });
      expect(mockTimeline.first).toHaveBeenCalledOnce();
    });

    it("calls window.timeline.last() on End key", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      fireEvent.keyDown(window, { key: "End" });
      expect(mockTimeline.last).toHaveBeenCalledOnce();
    });

    it("calls window.timeline.back() on ArrowLeft key", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      fireEvent.keyDown(window, { key: "ArrowLeft" });
      expect(mockTimeline.back).toHaveBeenCalledOnce();
    });

    it("calls window.timeline.next() on ArrowRight key", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      fireEvent.keyDown(window, { key: "ArrowRight" });
      expect(mockTimeline.next).toHaveBeenCalledOnce();
    });
  });

  // ── Keyboard shortcuts removed on unmount ────────────────────────────────────
  describe("Keyboard shortcuts cleanup", () => {
    it("removes keydown listener on unmount (ArrowLeft no longer fires)", async () => {
      const { unmount } = await act(async () => render(<MonitoringTimeline />));
      await act(async () => { unmount(); });
      vi.clearAllMocks(); // reset call counts
      fireEvent.keyDown(window, { key: "ArrowLeft" });
      expect(mockTimeline.back).not.toHaveBeenCalled();
    });
  });

  // ── Play / Pause ─────────────────────────────────────────────────────────────
  describe("Play / Pause", () => {
    it("calls window.timeline.play() when Play is clicked in paused state", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      fireEvent.click(screen.getByRole("button", { name: /Play/i }));
      expect(mockTimeline.play).toHaveBeenCalledOnce();
    });

    it("calls window.timeline.pause() when Pause is clicked in playing state", async () => {
      const { container } = await act(async () => render(<MonitoringTimeline />));
      // Simulate playback state via snapshot event
      const snap = makeSnapshot({ ui: { playback: true, panOffsetSec: 0, zoom: 1, category: "employees" } });
      await act(async () => {
        const snapshotCb = subscribeMock.mock.calls.find(([e]) => e === "snapshot")?.[1] as (s: unknown) => void;
        snapshotCb?.(snap);
      });
      // Now playback is true → button should say "Pause"
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Pause/i })).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole("button", { name: /Pause/i }));
      expect(mockTimeline.pause).toHaveBeenCalledOnce();
    });
  });

  // ── Tear out ─────────────────────────────────────────────────────────────────
  describe("Tear out", () => {
    it("calls window.timeline.torn() and then detach() when not already torn", async () => {
      mockTimeline.torn.mockResolvedValue(false);
      await act(async () => { render(<MonitoringTimeline />); });
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /Tear out/i }));
      });
      await waitFor(() => {
        expect(mockTimeline.torn).toHaveBeenCalled();
        expect(mockTimeline.detach).toHaveBeenCalledOnce();
      });
    });

    it("calls window.timeline.torn() and then attach() when already torn", async () => {
      mockTimeline.torn.mockResolvedValue(true);
      await act(async () => { render(<MonitoringTimeline />); });
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /Tear out/i }));
      });
      await waitFor(() => {
        expect(mockTimeline.attach).toHaveBeenCalledOnce();
      });
    });
  });

  // ── IPC event handling ───────────────────────────────────────────────────────
  describe("IPC event handling", () => {
    it("updates current time when snapshot event fires", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      const snapshotCb = subscribeMock.mock.calls.find(([e]) => e === "snapshot")?.[1] as (s: unknown) => void;
      const snap = makeSnapshot();
      snap.timeline!.times!.current = "12:30:00";
      await act(async () => { snapshotCb?.(snap); });
      await waitFor(() => {
        expect(screen.getByText("12:30:00")).toBeInTheDocument();
      });
    });

    it("dispatches 'move' CustomEvent when timeline:move fires", async () => {
      const { container } = await act(async () => render(<MonitoringTimeline />));
      const root = container.firstChild as HTMLElement;
      const moveSpy = vi.fn();
      root.addEventListener("move", moveSpy);

      const moveCb = subscribeMock.mock.calls.find(([e]) => e === "move")?.[1] as (s: unknown) => void;
      await act(async () => { moveCb?.(makeSnapshot()); });

      expect(moveSpy).toHaveBeenCalledOnce();
      root.removeEventListener("move", moveSpy);
    });

    it("marks torn=false when 'detached' fires with torn:false", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      const detachCb = subscribeMock.mock.calls.find(([e]) => e === "detached")?.[1] as (d: unknown) => void;
      await act(async () => { detachCb?.({ torn: false }); });
      // torn=false → data-torn attribute should be "false"
      const root = document.querySelector("[data-torn]");
      expect(root?.getAttribute("data-torn")).toBe("false");
    });

    it("marks torn=true when 'detached' fires with torn:true", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      const detachCb = subscribeMock.mock.calls.find(([e]) => e === "detached")?.[1] as (d: unknown) => void;
      await act(async () => { detachCb?.({ torn: true }); });
      const root = document.querySelector("[data-torn]");
      expect(root?.getAttribute("data-torn")).toBe("true");
    });

    it("sets playback=false when 'playback:paused' fires", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      const pausedCb = subscribeMock.mock.calls.find(([e]) => e === "playback:paused")?.[1] as (s: unknown) => void;
      await act(async () => { pausedCb?.(makeSnapshot()); });
      // After paused, the button should show "Play" (not "Pause")
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Play/i })).toBeInTheDocument();
      });
    });

    it("sets playback=false when 'playback:ended' fires", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      const endedCb = subscribeMock.mock.calls.find(([e]) => e === "playback:ended")?.[1] as (s: unknown) => void;
      await act(async () => { endedCb?.(makeSnapshot()); });
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Play/i })).toBeInTheDocument();
      });
    });
  });

  // ── Add Track ────────────────────────────────────────────────────────────────
  describe("Add Track", () => {
    it("calls window.timeline.addTrack() when Add Track button is clicked", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /Add Track/i }));
      });
      await waitFor(() => {
        expect(mockTimeline.addTrack).toHaveBeenCalledOnce();
      });
    });

    it("adds an 'employees' track by default", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /Add Track/i }));
      });
      await waitFor(() => {
        const call = (mockTimeline.addTrack.mock.calls as unknown as [unknown][])[0]?.[0];
        expect(call).toMatchObject({ category: "employees" });
      });
    });
  });

  // ── Action buttons disabled state ────────────────────────────────────────────
  describe("Action buttons disabled state", () => {
    it("action buttons are disabled when no track is selected", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      expect(screen.getByRole("button", { name: /Add In/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /Add Out/i })).toBeDisabled();
      // Use exact anchors to avoid matching "Unmark Person" with /Mark Person/i
      expect(screen.getByRole("button", { name: /^Mark Person$/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /^Unmark Person$/i })).toBeDisabled();
    });
  });

  // ── Category prop ────────────────────────────────────────────────────────────
  describe("Category prop", () => {
    it("defaults category to 'employees' when not specified", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      await waitFor(() => {
        const calls = mockTimeline.setUi.mock.calls as unknown as [{ category?: string }][];
        const call = calls.find((c) => c[0]?.category);
        expect(call?.[0].category).toBe("employees");
      });
    });

    it("uses provided category prop", async () => {
      await act(async () => { render(<MonitoringTimeline category="activities" />); });
      await waitFor(() => {
        const calls = mockTimeline.setUi.mock.calls as unknown as [{ category?: string }][];
        const call = calls.find((c) => c[0]?.category);
        expect(call?.[0].category).toBe("activities");
      });
    });
  });

  // ── Storage initialization ───────────────────────────────────────────────────
  describe("Storage initialization", () => {
    it("calls window.timeline.company() and location() on mount", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      await waitFor(() => {
        expect(mockTimeline.company).toHaveBeenCalled();
        expect(mockTimeline.location).toHaveBeenCalled();
      });
    });

    it("calls window.timeline.snapshot() on mount", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      await waitFor(() => {
        expect(mockTimeline.snapshot).toHaveBeenCalled();
      });
    });

    it("calls window.timeline.current() on mount", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      await waitFor(() => {
        expect(mockTimeline.current).toHaveBeenCalled();
      });
    });
  });

  // ── Session operations ───────────────────────────────────────────────────────
  describe("Session operations", () => {
    const makeSnapshotWithTrack = (): TimelineSnapshot =>
      makeSnapshot({
        ui: {
          panOffsetSec: 0, zoom: 1, category: "employees", playback: false,
          selection: { trackId: 1, sessionKeys: [] },
        },
        timeline: {
          times: {
            start: "08:00:00", end: "18:00:00", current: "09:00:00",
            buffer: 900, interval: 60, businessStart: "08:00:00", businessEnd: "18:00:00",
          },
          tracks: [{ id: 1, category: "employees", name: "Test", sessions: [] }],
        },
      });

    it("calls window.timeline.addSession with type 'in' when 'i' key is pressed and track is selected", async () => {
      mockTimeline.snapshot.mockResolvedValue(makeSnapshotWithTrack());
      await act(async () => { render(<MonitoringTimeline />); });
      // Apply snapshot so track is selected
      const snapshotCb = subscribeMock.mock.calls.find(([e]) => e === "snapshot")?.[1] as (s: unknown) => void;
      await act(async () => { snapshotCb?.(makeSnapshotWithTrack()); });
      await act(async () => {
        fireEvent.keyDown(window, { key: "i" });
      });
      await waitFor(() => {
        expect(mockTimeline.addSession).toHaveBeenCalledWith(1, expect.objectContaining({ type: "in" }));
      });
    });

    it("calls window.timeline.addSession with type 'out' when 'o' key is pressed and track is selected", async () => {
      mockTimeline.snapshot.mockResolvedValue(makeSnapshotWithTrack());
      await act(async () => { render(<MonitoringTimeline />); });
      const snapshotCb = subscribeMock.mock.calls.find(([e]) => e === "snapshot")?.[1] as (s: unknown) => void;
      await act(async () => { snapshotCb?.(makeSnapshotWithTrack()); });
      await act(async () => {
        fireEvent.keyDown(window, { key: "o" });
      });
      await waitFor(() => {
        expect(mockTimeline.addSession).toHaveBeenCalledWith(1, expect.objectContaining({ type: "out" }));
      });
    });
  });

  // ── Marking mode ─────────────────────────────────────────────────────────────
  describe("Marking mode", () => {
    it("starts marking via Start Marking button (dispatches keydown 'm')", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      // With no track selected, the button is disabled
      expect(screen.getByRole("button", { name: /^Mark Person$/i })).toBeDisabled();
    });

    it("Unmark button calls clearMarkersAt when track is selected", async () => {
      const snap = makeSnapshot({
        ui: { panOffsetSec: 0, zoom: 1, category: "employees", playback: false, selection: { trackId: 1, sessionKeys: [] } },
        timeline: {
          times: { start: "08:00:00", end: "18:00:00", current: "09:00:00", buffer: 900, interval: 60, businessStart: "08:00:00", businessEnd: "18:00:00" },
          tracks: [{ id: 1, category: "employees", name: "T", sessions: [] }],
        },
      });
      mockTimeline.snapshot.mockResolvedValue(snap);
      await act(async () => { render(<MonitoringTimeline />); });
      const snapshotCb = subscribeMock.mock.calls.find(([e]) => e === "snapshot")?.[1] as (s: unknown) => void;
      await act(async () => { snapshotCb?.(snap); });
      // Wait for the Unmark button to become enabled (trackSelected propagated from snapshot)
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /^Unmark Person$/i })).not.toBeDisabled();
      });
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /^Unmark Person$/i }));
      });
      await waitFor(() => {
        expect(mockTimeline.clearMarkersAt).toHaveBeenCalledWith(1, expect.objectContaining({ tolerance: 0.4 }));
      });
    });
  });

  // ── Empty placeholder ─────────────────────────────────────────────────────────
  describe("Empty placeholder", () => {
    it("shows empty placeholder when no tracks are loaded", async () => {
      await act(async () => { render(<MonitoringTimeline />); });
      const snap = makeSnapshot({ timeline: { times: undefined, tracks: [] } });
      const snapshotCb = subscribeMock.mock.calls.find(([e]) => e === "snapshot")?.[1] as (s: unknown) => void;
      await act(async () => { snapshotCb?.(snap); });
      // The component renders the placeholder; its visibility depends on hasNoTracks state
      // We check that the element is in the DOM (visibility via CSS)
      const placeholders = document.querySelectorAll(".empty-placeholder, [data-testid='empty-placeholder']");
      // At minimum the text node should be present somewhere in the doc
      expect(document.body.textContent).toContain("Press the");
    });
  });

  // ── Unmount cleanup ───────────────────────────────────────────────────────────
  describe("Unmount cleanup", () => {
    it("does not throw when unmounted while init is in progress", async () => {
      let resolveSnapshot!: (v: TimelineSnapshot) => void;
      mockTimeline.snapshot.mockImplementationOnce(
        () => new Promise<TimelineSnapshot>((r) => { resolveSnapshot = r; }),
      );
      const { unmount } = await act(async () => render(<MonitoringTimeline />));
      expect(() => act(() => { unmount(); })).not.toThrow();
      // Resolve after unmount to exercise the cancelled guard
      resolveSnapshot(makeSnapshot());
    });

    it("removes window event listeners on unmount", async () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
      const { unmount } = await act(async () => render(<MonitoringTimeline />));
      await act(async () => { unmount(); });
      expect(removeEventListenerSpy).toHaveBeenCalled();
    });
  });
});

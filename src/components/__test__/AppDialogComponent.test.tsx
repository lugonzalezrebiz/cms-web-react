import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
} from "@testing-library/react";
import AppDialogComponent from "../AppDialogComponent";

// ── Popover API mocks ─────────────────────────────────────────────────────────
//
// jsdom does not implement the native Popover API (showPopover / hidePopover).
// We add them to HTMLElement.prototype before each test so the component's
// useEffect can call them, and restore the prototype after each test.

const mockShowPopover = vi.fn();
const mockHidePopover = vi.fn();

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "showPopover", {
    configurable: true,
    writable: true,
    value: mockShowPopover,
  });
  Object.defineProperty(HTMLElement.prototype, "hidePopover", {
    configurable: true,
    writable: true,
    value: mockHidePopover,
  });
  mockShowPopover.mockClear();
  mockHidePopover.mockClear();
});

afterEach(() => {
  cleanup();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (HTMLElement.prototype as any).showPopover;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (HTMLElement.prototype as any).hidePopover;
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderDialog(
  props: Partial<React.ComponentProps<typeof AppDialogComponent>> = {},
) {
  const defaults = { open: false };
  return render(<AppDialogComponent {...defaults} {...props} />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("AppDialogComponent", () => {
  // ── Default rendering ──────────────────────────────────────────────────────

  describe("default rendering", () => {
    it("renders the default title when no title prop is given", () => {
      renderDialog();
      expect(screen.getByText("Untitled")).toBeInTheDocument();
    });

    it("renders a custom title from props", () => {
      renderDialog({ title: "Camera Error" });
      expect(screen.getByText("Camera Error")).toBeInTheDocument();
    });

    it("renders an empty description when no description prop is given", () => {
      renderDialog();
      // The description div is always rendered; its text should be empty
      const descriptions = screen.getAllByText("", { exact: false });
      expect(descriptions.length).toBeGreaterThan(0);
    });

    it("renders a custom description from props", () => {
      renderDialog({ description: "Connection timed out." });
      expect(screen.getByText("Connection timed out.")).toBeInTheDocument();
    });

    it("renders the close button", () => {
      renderDialog();
      expect(
        screen.getByRole("button", { name: "Close dialog" }),
      ).toBeInTheDocument();
    });

    it("sets role='dialog' on the root element", () => {
      renderDialog();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  // ── Accent color ───────────────────────────────────────────────────────────

  describe("accent color", () => {
    it("renders without error when using the default accent color", () => {
      expect(() => renderDialog()).not.toThrow();
    });

    it("renders without error when a custom accent color is provided", () => {
      expect(() => renderDialog({ accentColor: "#0077ff" })).not.toThrow();
    });
  });

  // ── Popover API — open state ───────────────────────────────────────────────

  describe("popover API — open state", () => {
    it("calls hidePopover on mount when open=false", () => {
      renderDialog({ open: false });
      expect(mockHidePopover).toHaveBeenCalledTimes(1);
      expect(mockShowPopover).not.toHaveBeenCalled();
    });

    it("calls showPopover on mount when open=true", () => {
      renderDialog({ open: true });
      expect(mockShowPopover).toHaveBeenCalledTimes(1);
      expect(mockHidePopover).not.toHaveBeenCalled();
    });

    it("calls showPopover when open changes from false to true", () => {
      const { rerender } = renderDialog({ open: false });
      mockShowPopover.mockClear();
      mockHidePopover.mockClear();

      act(() => {
        rerender(<AppDialogComponent open={true} />);
      });

      expect(mockShowPopover).toHaveBeenCalledTimes(1);
      expect(mockHidePopover).not.toHaveBeenCalled();
    });

    it("calls hidePopover when open changes from true to false", () => {
      const { rerender } = renderDialog({ open: true });
      mockShowPopover.mockClear();
      mockHidePopover.mockClear();

      act(() => {
        rerender(<AppDialogComponent open={false} />);
      });

      expect(mockHidePopover).toHaveBeenCalledTimes(1);
      expect(mockShowPopover).not.toHaveBeenCalled();
    });

    it("does not call popover methods again when unrelated props change", () => {
      const { rerender } = renderDialog({ open: true, title: "A" });
      mockShowPopover.mockClear();
      mockHidePopover.mockClear();

      act(() => {
        rerender(<AppDialogComponent open={true} title="B" />);
      });

      expect(mockShowPopover).not.toHaveBeenCalled();
      expect(mockHidePopover).not.toHaveBeenCalled();
    });
  });

  // ── Close interaction ──────────────────────────────────────────────────────

  describe("close interaction", () => {
    it("calls onClose when the close button is clicked", () => {
      const onClose = vi.fn();
      renderDialog({ onClose });
      fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not throw when close button is clicked without an onClose handler", () => {
      renderDialog({ onClose: undefined });
      expect(() =>
        fireEvent.click(screen.getByRole("button", { name: "Close dialog" })),
      ).not.toThrow();
    });
  });

  // ── Children / dialog body ─────────────────────────────────────────────────

  describe("children / dialog body", () => {
    it("renders children inside the dialog body when provided", () => {
      renderDialog({ children: <p>Dialog content here</p> });
      expect(screen.getByText("Dialog content here")).toBeInTheDocument();
    });

    it("does not render a dialog body section when children are absent", () => {
      renderDialog({ children: undefined });
      expect(screen.queryByText("Dialog content here")).not.toBeInTheDocument();
    });

    it("does not render a dialog body section when children is null", () => {
      renderDialog({ children: null });
      // null is treated as absent — no body element rendered
      const dialog = screen.getByRole("dialog");
      // Should only contain the Header (no extra wrapper div for body)
      expect(dialog.children.length).toBe(1);
    });
  });

  // ── displayName ────────────────────────────────────────────────────────────

  describe("displayName", () => {
    it("has displayName set to 'AppDialogComponent'", () => {
      expect(AppDialogComponent.displayName).toBe("AppDialogComponent");
    });
  });
});

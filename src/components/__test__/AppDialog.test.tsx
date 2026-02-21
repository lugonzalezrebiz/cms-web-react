import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@emotion/react";
import { theme } from "../../theme";
import AppDialog from "../AppDialog";
import type { AppDialogProps } from "../AppDialog";

// --- Helper ---

const renderDialog = (props: Partial<AppDialogProps> = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <AppDialog open={false} {...props} />
    </ThemeProvider>,
  );

// --- Tests ---

describe("AppDialog", () => {
  // ── Rendering: always in DOM ──────────────────────────────────────────────

  describe("always rendered", () => {
    it("renders dialog element when closed", () => {
      const { getByRole } = renderDialog({ open: false });
      expect(getByRole("dialog")).toBeInTheDocument();
    });

    it("renders backdrop element when closed", () => {
      const { getByTestId } = renderDialog({ open: false });
      expect(getByTestId("dialog-backdrop")).toBeInTheDocument();
    });

    it("renders dialog element when open", () => {
      const { getByRole } = renderDialog({ open: true });
      expect(getByRole("dialog")).toBeInTheDocument();
    });

    it("renders backdrop element when open", () => {
      const { getByTestId } = renderDialog({ open: true });
      expect(getByTestId("dialog-backdrop")).toBeInTheDocument();
    });
  });

  // ── Title ─────────────────────────────────────────────────────────────────

  describe("title", () => {
    it("shows default title 'Untitled' when not provided", () => {
      const { getByRole } = renderDialog({ open: true });
      expect(getByRole("heading", { name: "Untitled" })).toBeInTheDocument();
    });

    it("shows the provided title", () => {
      const { getByRole } = renderDialog({ open: true, title: "Camera Alert" });
      expect(
        getByRole("heading", { name: "Camera Alert" }),
      ).toBeInTheDocument();
    });
  });

  // ── Description ───────────────────────────────────────────────────────────

  describe("description", () => {
    it("shows empty description when not provided", () => {
      const { getByTestId } = renderDialog({ open: true });
      expect(getByTestId("dialog-description").textContent).toBe("");
    });

    it("shows the provided description", () => {
      const { getByTestId } = renderDialog({
        open: true,
        description: "Camera offline since 18:00",
      });
      expect(getByTestId("dialog-description").textContent).toBe(
        "Camera offline since 18:00",
      );
    });
  });

  // ── Children ──────────────────────────────────────────────────────────────

  describe("children", () => {
    it("renders content area with children when provided", () => {
      const { getByTestId, getByText } = renderDialog({
        open: true,
        children: <p>Dialog body</p>,
      });
      expect(getByTestId("dialog-content")).toBeInTheDocument();
      expect(getByText("Dialog body")).toBeInTheDocument();
    });

    it("does not render content area when children is not provided", () => {
      const { queryByTestId } = renderDialog({ open: true });
      expect(queryByTestId("dialog-content")).not.toBeInTheDocument();
    });
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  describe("accessibility", () => {
    it("sets aria-modal on the dialog", () => {
      const { getByRole } = renderDialog({ open: true });
      expect(getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    });

    it("sets aria-labelledby pointing to the title", () => {
      const { getByRole } = renderDialog({ open: true, title: "My Dialog" });
      const dialog = getByRole("dialog");
      const labelId = dialog.getAttribute("aria-labelledby");
      expect(labelId).toBeTruthy();
      const labelEl = document.getElementById(labelId!);
      expect(labelEl?.textContent).toBe("My Dialog");
    });

    it("renders close button with accessible label", () => {
      const { getByRole } = renderDialog({ open: true });
      expect(getByRole("button", { name: "Close dialog" })).toBeInTheDocument();
    });
  });

  // ── Accent color ──────────────────────────────────────────────────────────

  describe("accentColor", () => {
    it("applies default accent color CSS variable when not provided", () => {
      const { getByTestId } = renderDialog({ open: true });
      const dialog = getByTestId("app-dialog");
      expect(dialog.style.getPropertyValue("--cms-accent-color")).toBe(
        "#ff6000",
      );
    });

    it("applies custom accent color CSS variable when provided", () => {
      const { getByTestId } = renderDialog({
        open: true,
        accentColor: "#0070f3",
      });
      const dialog = getByTestId("app-dialog");
      expect(dialog.style.getPropertyValue("--cms-accent-color")).toBe(
        "#0070f3",
      );
    });
  });

  // ── Interactions ──────────────────────────────────────────────────────────

  describe("interactions", () => {
    it("calls onClose when close button is clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const { getByRole } = renderDialog({ open: true, onClose });
      await user.click(getByRole("button", { name: "Close dialog" }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when backdrop is clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const { getByTestId } = renderDialog({ open: true, onClose });
      await user.click(getByTestId("dialog-backdrop"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not throw when onClose is not provided and close button is clicked", async () => {
      const user = userEvent.setup();
      const { getByRole } = renderDialog({ open: true });
      await expect(
        user.click(getByRole("button", { name: "Close dialog" })),
      ).resolves.not.toThrow();
    });

    it("does not throw when onClose is not provided and backdrop is clicked", async () => {
      const user = userEvent.setup();
      const { getByTestId } = renderDialog({ open: true });
      await expect(
        user.click(getByTestId("dialog-backdrop")),
      ).resolves.not.toThrow();
    });
  });
});

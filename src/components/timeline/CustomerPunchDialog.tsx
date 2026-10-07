import { useEffect } from "react";
import { Box } from "@mui/system";
import styled from "@emotion/styled";
import FormDialog from "../FormDialog";
import Button from "../Button";
import { Colors, Fonts } from "../../theme";
import { assetUrl } from "../../utils";
import {
  LabeledValue,
  PickerSubText,
  PickerTitleText,
} from "./PunchPickerPanel";
import type { ReEnterCustomer } from "./CustomerReEnterDialog";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Selectable counts, e.g. [1..10]. */
  countOptions: number[];
  selectedCount: number;
  onCountChange: (count: number) => void;
  onPunchIn: () => void;
  onSelectReEnter: () => void;
  /** Re-entering customer picked in the Re-Enter dialog, if any. */
  reEnterCustomer?: ReEnterCustomer | null;
  onClearReEnter?: () => void;
}

const Label = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "14px",
  lineHeight: "20px",
  color: Colors.charcoalNavy,
});

const footerButtonStyle = { padding: "0 15px", height: "30px" };

const CustomerPunchDialog = ({
  open,
  onClose,
  countOptions,
  selectedCount,
  onCountChange,
  onPunchIn,
  onSelectReEnter,
  reEnterCustomer,
  onClearReEnter,
}: Props) => {
  // Keyboard while open: → / ↑ raise the count, ← / ↓ lower it, a digit picks one
  // ("0" is 10), Enter punches in. Listened to in the capture phase so these
  // keys don't also reach the timeline's shortcuts.
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const current = countOptions.indexOf(selectedCount);
      const step =
        e.key === "ArrowRight" || e.key === "ArrowUp"
          ? 1
          : e.key === "ArrowLeft" || e.key === "ArrowDown"
            ? -1
            : 0;
      if (step !== 0) {
        e.preventDefault();
        e.stopPropagation();
        const next = Math.max(
          0,
          Math.min(countOptions.length - 1, current + step),
        );
        if (countOptions[next] !== undefined) onCountChange(countOptions[next]);
        return;
      }
      if (/^[0-9]$/.test(e.key)) {
        const count = e.key === "0" ? 10 : Number(e.key);
        if (!countOptions.includes(count)) return;
        e.preventDefault();
        e.stopPropagation();
        onCountChange(count);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        onPunchIn();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [open, countOptions, selectedCount, onCountChange, onPunchIn]);

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title="Customer Punch in"
      maxWidth="530px"
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Label>Select the customer count</Label>
        <Box sx={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {countOptions.map((count) => (
            <Button
              key={count}
              outfit
              color="secondary"
              selected={selectedCount === count}
              onClick={() => onCountChange(count)}
              fontSize="14px"
              sx={{
                minWidth: 0,
                width: "38px",
                height: "38px",
                padding: 0,
              }}
            >
              {count}
            </Button>
          ))}
        </Box>
      </Box>
  
      {reEnterCustomer && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            py: "8px",
            borderTop: `1px solid ${Colors.lightGrayishBlue}`,
            borderBottom: `1px solid ${Colors.lightGrayishBlue}`,
          }}
        >
          <Box>
            <PickerTitleText>Customer: {reEnterCustomer.number}</PickerTitleText>
            <PickerSubText>
              <LabeledValue
                label="Attended by"
                value={reEnterCustomer.attendedBy}
              />
            </PickerSubText>
            <PickerSubText>
              <LabeledValue
                label="Punched Out"
                value={reEnterCustomer.punchedOut}
              />
            </PickerSubText>
          </Box>
          <Box
            component="button"
            type="button"
            aria-label="Remove re-entering customer"
            onClick={onClearReEnter}
            sx={{
              border: "none",
              background: "transparent",
              p: 0,
              cursor: "pointer",
              display: "flex",
              "& img": { width: 12, height: 12, opacity: 0.4 },
            }}
          >
            <img src={assetUrl("x-close.svg")} alt="" />
          </Box>
        </Box>
      )}
  
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          mt: "8px",
        }}
      >
        <Button
          outfit
          color="secondary"
          fontSize="14px"
          style={footerButtonStyle}
          onClick={onSelectReEnter}
        >
          {reEnterCustomer
            ? "Change Re-Entering Customer"
            : "Select customer if Re-Enter"}
        </Button>
        <Box sx={{ display: "flex", gap: "12px" }}>
          <Button
            outfit
            color="secondary"
            fontSize="14px"
            style={footerButtonStyle}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            outfit
            fontSize="14px"
            style={footerButtonStyle}
            onClick={onPunchIn}
          >
            Punch In
          </Button>
        </Box>
      </Box>
    </FormDialog>
  );
};

export default CustomerPunchDialog;

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  DialogActions,
} from "@mui/material";
import { Colors, Fonts } from "../../theme";
import Button from "../Button";
import { secToTimeString } from "./utils";

interface GoToTimeDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (sec: number) => void;
  timelineStartSec: number;
  timelineEndSec: number;
}

const parseTime = (value: string): number | null => {
  const parts = value.split(":").map((p) => parseInt(p, 10));
  if (parts.some(isNaN)) return null;
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }
  if (parts.length === 2) {
    const [h, m] = parts;
    return h * 3600 + m * 60;
  }
  return null;
};


export const GoToTimeDialog = ({
  open,
  onClose,
  onConfirm,
  timelineStartSec,
  timelineEndSec,
}: GoToTimeDialogProps) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setValue(secToTimeString(timelineStartSec));
      setError("");
    }
  }, [open, timelineStartSec]);

  const handleConfirm = () => {
    const sec = parseTime(value);
    if (sec === null) {
      setError("Invalid format. Use HH:MM:SS or HH:MM");
      return;
    }
    if (sec < timelineStartSec || sec > timelineEndSec) {
      setError(
        `Out of range (${secToTimeString(timelineStartSec)} – ${secToTimeString(timelineEndSec)})`,
      );
      return;
    }
    onConfirm(sec);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleConfirm();
    if (e.key === "Escape") onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: "16px",
          padding: "8px",
          minWidth: 300,
          fontFamily: Fonts.main,
        },
      }}
    >
      <DialogTitle
        sx={{
          fontFamily: Fonts.main,
          fontWeight: 600,
          fontSize: 18,
          color: Colors.lightBlack,
          paddingBottom: 0,
        }}
      >
        Go to specific time
      </DialogTitle>
      <DialogContent sx={{ paddingTop: "16px !important" }}>
        <TextField
          autoFocus
          fullWidth
          label="Time (HH:MM:SS)"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          onKeyDown={handleKeyDown}
          error={!!error}
          helperText={error || " "}
          placeholder="00:00:00"
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              fontFamily: Fonts.main,
              "&.Mui-focused fieldset": { borderColor: Colors.vividOrange },
            },
            "& .MuiInputLabel-root.Mui-focused": { color: Colors.vividOrange },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ padding: "0 24px 16px" }}>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleConfirm}>Go</Button>
      </DialogActions>
    </Dialog>
  );
};

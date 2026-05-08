import { useState } from "react";
import type React from "react";

export const usePopover = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  return {
    anchorEl,
    open: Boolean(anchorEl),
    handleOpen: (e: React.MouseEvent<HTMLElement>) =>
      setAnchorEl(e.currentTarget),
    handleClose: () => setAnchorEl(null),
  };
};

export type PopoverState = ReturnType<typeof usePopover>;

export default usePopover;

import { useState } from "react";

export const useEventMenu =(handleAddMenuItem: (label: string) => void) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [input, setInput] = useState("");

  const handleAdd = () => {
    if (!input.trim()) return;
    handleAddMenuItem(input.trim());
    setInput("");
  };

  return { anchorEl, setAnchorEl, input, setInput, handleAdd };
}

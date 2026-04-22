import { useState, useEffect } from "react";

export const useExpandedCamera = () => {
  const [expandedCamera, setExpandedCamera] = useState<number | null>(null);

  useEffect(() => {
    if (expandedCamera === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpandedCamera(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expandedCamera]);

  const handleExpandCamera = (index: number) => {
    setExpandedCamera((prev) => (prev === index ? null : index));
  };

  return { expandedCamera, handleExpandCamera };
};

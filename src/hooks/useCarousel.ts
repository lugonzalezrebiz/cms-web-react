import { useState } from "react";

export const useCarousel=(count: number, onChange?: (index: number) => void)=> {
  const [current, setCurrent] = useState(0);

  const goTo = (index: number) => {
    setCurrent(index);
    onChange?.(index);
  };

  const prev = () => goTo((current - 1 + count) % count);
  const next = () => goTo((current + 1) % count);

  return { current, goTo, prev, next };
}

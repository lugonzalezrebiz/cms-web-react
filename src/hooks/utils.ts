export const timestampToSec = (ts: string): number => {
  if (!ts) return -1;
  if (ts.includes(":")) {
    const [h, m, s] = ts.split(":").map(Number);
    return h * 3600 + m * 60 + (s || 0);
  }
  if (ts.length === 6) {
    return Number(ts.slice(0, 2)) * 3600 + Number(ts.slice(2, 4)) * 60 + Number(ts.slice(4, 6));
  }
  return -1;
};

export const secToCompact = (sec: number): string => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}${String(s).padStart(2, "0")}`;
};

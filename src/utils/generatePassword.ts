const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const ALL = UPPER + LOWER + DIGITS;

export function generatePassword(): string {
  const length = Math.floor(Math.random() * 5) + 10;
  const chars = [
    UPPER[Math.floor(Math.random() * UPPER.length)],
    ...Array.from(
      { length: length - 1 },
      () => ALL[Math.floor(Math.random() * ALL.length)],
    ),
  ];
  return chars.sort(() => Math.random() - 0.5).join("");
}

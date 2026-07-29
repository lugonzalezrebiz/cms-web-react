const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const bigrams = (value: string): string[] => {
  const chars = value.replace(/\s+/g, " ");
  const result: string[] = [];
  for (let i = 0; i < chars.length - 1; i++) {
    result.push(chars.slice(i, i + 2));
  }
  return result;
};

export const stringSimilarity = (a: string, b: string): number => {
  const normalizedA = normalize(a);
  const normalizedB = normalize(b);
  if (!normalizedA || !normalizedB) return 0;
  if (normalizedA === normalizedB) return 1;

  const bigramsA = bigrams(normalizedA);
  const bigramsB = bigrams(normalizedB);
  if (bigramsA.length === 0 || bigramsB.length === 0) return 0;

  const bucket = new Map<string, number>();
  for (const gram of bigramsA) {
    bucket.set(gram, (bucket.get(gram) ?? 0) + 1);
  }

  let matches = 0;
  for (const gram of bigramsB) {
    const count = bucket.get(gram) ?? 0;
    if (count > 0) {
      matches++;
      bucket.set(gram, count - 1);
    }
  }

  return (2 * matches) / (bigramsA.length + bigramsB.length);
};

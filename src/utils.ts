export const assetUrl = (name: string): string =>
  window.location.protocol === "file:" ? `./assets/${name}` : `/assets/${name}`;

import { Global, css } from "@emotion/react";
import { tokens } from "./theme";

function vars(obj: Record<string, string>): string {
  return Object.entries(obj)
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");
}

export function GlobalStyles() {
  return (
    <Global
      styles={css`
        :root {
          ${vars({ ...tokens.base, ...tokens.light })}
        }

        @media (prefers-color-scheme: dark) {
          :root {
            ${vars(tokens.dark)}
          }
        }

        html[data-theme="light"] {
          ${vars(tokens.light)}
        }

        html[data-theme="dark"] {
          ${vars(tokens.dark)}
        }
      `}
    />
  );
}

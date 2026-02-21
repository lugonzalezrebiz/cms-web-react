export const theme = {
  colors: {
    bg: 'var(--color-bg)',
    text: 'var(--color-text)',
    border: 'var(--color-border)',
    headerBg: 'var(--color-header-bg)',
    closeBg: 'var(--color-close-bg)',
  },
  shadows: {
    dialog: 'var(--shadow-dialog)',
  },
} as const;

export type AppTheme = typeof theme;

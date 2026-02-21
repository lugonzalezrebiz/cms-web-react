import { memo } from "react";
import type { ReactNode, CSSProperties } from "react";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

// --- Interfaces ---

export interface AppDialogProps {
  title?: string;
  description?: string;
  accentColor?: string;
  open: boolean;
  onClose?: () => void;
  children?: ReactNode;
}

// --- Animations ---

const moveForever = keyframes`
  0%   { transform: translate3d(-90px, 0, 0); }
  100% { transform: translate3d(85px, 0, 0); }
`;

// --- Styled Components ---

const Backdrop = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.533);
  backdrop-filter: blur(4px);
  pointer-events: ${({ $open }) => ($open ? "all" : "none")};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transition: opacity 300ms ease-in-out;
  z-index: 999;
`;

const DialogRoot = styled.div<{ $open: boolean }>`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%)
    ${({ $open }) => ($open ? "scale(1)" : "scale(0.01) translateX(-100lvh)")};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  visibility: ${({ $open }) => ($open ? "visible" : "hidden")};
  transition:
    transform 300ms ease-in-out,
    opacity 300ms ease-in-out,
    visibility 0s ${({ $open }) => ($open ? "0s" : "300ms")};
  z-index: 1000;
  pointer-events: ${({ $open }) => ($open ? "all" : "none")};
  min-width: 50lvw;
  border: solid 1px ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  padding: 0;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.dialog};
  font-family: inherit;
  background: ${({ theme }) => theme.colors.bg};
  backdrop-filter: blur(4px);
  user-select: all;
`;

const Header = styled.div`
  position: relative;
  padding: 1em;
  min-height: 40px;
  display: grid;
  grid-template-columns: 1fr;
  background-color: ${({ theme }) => theme.colors.headerBg};
`;

const HeaderBackground = styled.div`
  position: relative;
  grid-row: 1 / -1;
  grid-column: 1 / -1;
  align-self: end;
  margin: -1em;
  z-index: 1;
`;

const WaveSvg = styled.svg`
  position: relative;
  width: 100%;
  margin-bottom: -7px;
  height: 60px;
  min-height: 60px;
  max-height: 100%;

  .wave {
    animation: ${moveForever} 25s cubic-bezier(0.55, 0.5, 0.45, 0.5) infinite;
  }

  .wave:nth-child(1) {
    fill-opacity: 0.1;
    animation-delay: -2s;
    animation-duration: 7s;
  }

  .wave:nth-child(2) {
    fill-opacity: 0.05;
    animation-delay: -3s;
    animation-duration: 10s;
  }

  .wave:nth-child(3) {
    fill-opacity: 0.01;
    animation-delay: -4s;
    animation-duration: 13s;
  }

  .wave:nth-child(4) {
    animation-delay: -5s;
    animation-duration: 20s;
  }
`;

const HeaderContent = styled.div`
  position: relative;
  grid-row: 1 / -1;
  grid-column: 1 / -1;
  z-index: 2;
`;

const DialogTitle = styled.h1`
  margin: 0;
  margin-block-end: 0.25em;
  font-family: "Gugi", sans-serif;
  font-weight: 400;
  font-size: 1.4em;
  color: color-mix(
    in srgb,
    var(--cms-accent-color, #ff6000) 80%,
    ${({ theme }) => theme.colors.headerBg} 20%
  );
`;

const DialogDescription = styled.div`
  margin: 0;
  color: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.text} 80%,
    ${({ theme }) => theme.colors.headerBg} 20%
  );
  mix-blend-mode: multiply;
  line-height: 1.5;
  font-size: 1em;
`;

const CloseButton = styled.button`
  position: absolute;
  display: grid;
  place-items: center;
  background: ${({ theme }) => theme.colors.closeBg};
  color: ${({ theme }) => theme.colors.text};
  backdrop-filter: blur(4px);
  border-radius: 50%;
  border: none;
  padding: 0.25em;
  top: 0;
  right: 0;
  width: 2em;
  height: 2em;
  cursor: pointer;
  transition: transform 0.2s ease;
`;

const ContentArea = styled.div`
  color: ${({ theme }) => theme.colors.text};
  background-color: ${({ theme }) => theme.colors.bg};
  border-radius: 0 0 8px 8px;
  padding: 1em;
`;

// --- Sub-components ---

const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);

interface WaveAnimationProps {
  accentColor: string;
}

const WaveAnimation = memo(({ accentColor }: WaveAnimationProps) => (
  <WaveSvg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 24 150 28"
    preserveAspectRatio="none"
    shapeRendering="auto"
    aria-hidden="true"
  >
    <defs>
      <path
        id="cms-wave-path"
        d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352Z"
      />
    </defs>
    <g className="waves">
      <use
        className="wave"
        href="#cms-wave-path"
        x="48"
        y="0"
        fill={accentColor}
      />
      <use
        className="wave"
        href="#cms-wave-path"
        x="48"
        y="3"
        fill={accentColor}
      />
      <use
        className="wave"
        href="#cms-wave-path"
        x="48"
        y="5"
        fill={accentColor}
      />
      <use
        className="wave"
        href="#cms-wave-path"
        x="48"
        y="7"
        fill="var(--color-bg)"
      />
    </g>
  </WaveSvg>
));

// --- Component ---

const AppDialog = memo(
  ({
    title = "Untitled",
    description = "",
    accentColor = "#ff6000",
    open,
    onClose,
    children,
  }: AppDialogProps) => {
    const style = { "--cms-accent-color": accentColor } as CSSProperties;

    return (
      <>
        <Backdrop
          $open={open}
          onClick={onClose}
          data-testid="dialog-backdrop"
        />
        <DialogRoot
          $open={open}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cms-dialog-title"
          style={style}
          data-testid="app-dialog"
        >
          <Header>
            <HeaderBackground>
              <WaveAnimation accentColor={accentColor} />
            </HeaderBackground>
            <HeaderContent>
              <CloseButton onClick={onClose} aria-label="Close dialog">
                <CloseIcon />
              </CloseButton>
              <DialogTitle id="cms-dialog-title">{title}</DialogTitle>
              <DialogDescription data-testid="dialog-description">
                {description}
              </DialogDescription>
            </HeaderContent>
          </Header>
          {children != null && (
            <ContentArea data-testid="dialog-content">{children}</ContentArea>
          )}
        </DialogRoot>
      </>
    );
  },
);

export default AppDialog;

import { memo, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface AppDialogProps {
  title?: string;
  description?: string;
  accentColor?: string;
  open?: boolean;
  onClose?: () => void;
  children?: ReactNode;
}

interface DialogRootProps {
  $accentColor: string;
}

// ── Keyframes ─────────────────────────────────────────────────────────────────

const moveForever = keyframes`
  0%   { transform: translate3d(-90px, 0, 0); }
  100% { transform: translate3d(85px,  0, 0); }
`;

// ── Styled components ─────────────────────────────────────────────────────────

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: #0008;
  backdrop-filter: blur(4px);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DialogRoot = styled("div", {
  shouldForwardProp: (prop) => prop !== "$accentColor",
})<DialogRootProps>`
  --accent-color: ${({ $accentColor }) => $accentColor};

  min-width: 50lvw;
  border: solid 1px var(--color-dialog-border);
  border-radius: var(--border-radius);
  padding: 0;
  overflow: hidden;
  box-shadow: var(--shadow-dialog);
  font-family: inherit;
  background: var(--color-background);
  backdrop-filter: blur(4px);
`;

const Header = styled.div`
  position: relative;
  padding: 1em;
  min-height: 40px;
  display: grid;
  grid-template-columns: 1fr;
  background-color: var(--color-header-bg);
`;

const HeaderBackground = styled.div`
  position: relative;
  grid-row: 1 / -1;
  grid-column: 1 / -1;
  align-self: end;
  margin: -1em;
  z-index: 1;
`;

const WaveWrapper = styled("svg")`
  position: relative;
  width: 100%;
  margin-bottom: -7px;
  height: 60px;
  min-height: 60px;
  max-height: 100%;
`;

const WaveGroup = styled("g")`
  & > use {
    animation: ${moveForever} 25s cubic-bezier(0.55, 0.5, 0.45, 0.5) infinite;
    fill: hsl(from var(--accent-color) h s l / 0);
  }
  & > use:nth-child(1) {
    fill: hsl(from var(--accent-color) h s l / 0.1);
    animation-delay: -2s;
    animation-duration: 7s;
  }
  & > use:nth-child(2) {
    fill: hsl(from var(--accent-color) h s l / 0.05);
    animation-delay: -3s;
    animation-duration: 10s;
  }
  & > use:nth-child(3) {
    fill: hsl(from var(--accent-color) h s l / 0.01);
    animation-delay: -4s;
    animation-duration: 13s;
  }
  & > use:nth-child(4) {
    fill: var(--color-background);
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

const Title = styled.h1`
  margin: 0;
  margin-block-end: 0.25em;
  font-family: "Gugi", sans-serif;
  font-weight: 400;
  font-size: 1.4em;
  color: color-mix(
    in srgb,
    var(--accent-color) 80%,
    var(--color-header-bg) 20%
  );
`;

const DialogDescription = styled.p`
  margin: 0;
  color: color-mix(in srgb, var(--color-text) 80%, var(--color-header-bg) 20%);
  line-height: 1.5;
  font-size: 1em;
`;

const CloseButton = styled.button`
  position: absolute;
  display: grid;
  place-items: center;
  background: var(--color-close-bg);
  color: var(--color-text);
  backdrop-filter: blur(4px);
  border-radius: 50%;
  padding: 0.25em;
  top: 0;
  right: 0;
  width: 2em;
  height: 2em;
  cursor: pointer;
  border: none;
  transition:
    transform 0.2s ease,
    fill 0.2s ease;
  font-size: 1em;
  line-height: 1;
`;

const ContentSlot = styled.div`
  color: var(--color-text);
  background-color: var(--color-background);
  border-radius: 0 0 var(--border-radius) var(--border-radius);
  padding: 1em;
`;

// ── Component ─────────────────────────────────────────────────────────────────

const AppDialogComponent = memo(
  ({
    title = "Untitled",
    description = "",
    accentColor = "#ff6000",
    open = false,
    onClose,
    children,
  }: AppDialogProps) => {
    const backdropRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const el = backdropRef.current;
      if (!el) return;
      if (open) {
        el.showPopover();
      } else {
        el.hidePopover();
      }
    }, [open]);

    return (
      <Backdrop
        ref={backdropRef}
        data-testid="dialog-backdrop"
        popover="manual"
      >
        <DialogRoot $accentColor={accentColor} role="dialog" aria-modal="true">
          <Header>
            <HeaderBackground>
              <WaveWrapper
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 24 150 28"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <path
                    id="cms-dialog-wave"
                    d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352Z"
                  />
                </defs>
                <WaveGroup>
                  <use href="#cms-dialog-wave" x="48" y="0" />
                  <use href="#cms-dialog-wave" x="48" y="3" />
                  <use href="#cms-dialog-wave" x="48" y="5" />
                  <use href="#cms-dialog-wave" x="48" y="7" />
                </WaveGroup>
              </WaveWrapper>
            </HeaderBackground>

            <HeaderContent>
              <CloseButton
                onClick={onClose}
                aria-label="Close dialog"
                type="button"
              >
                ✕
              </CloseButton>
              <Title>{title}</Title>
              <DialogDescription data-testid="dialog-description">
                {description}
              </DialogDescription>
            </HeaderContent>
          </Header>

          {children != null && <ContentSlot>{children}</ContentSlot>}
        </DialogRoot>
      </Backdrop>
    );
  },
);

export default AppDialogComponent;

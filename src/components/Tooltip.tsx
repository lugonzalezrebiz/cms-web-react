import styled from "@emotion/styled";
import MuiTooltip, {
  tooltipClasses,
  type TooltipProps,
} from "@mui/material/Tooltip";
import { memo, type ReactNode } from "react";
import { Colors, Fonts } from "../theme";

export interface Props {
  detail: ReactNode;
  icon?: string;
  iconWidth?: string;
  iconHeight?: string;
  withoutIcon?: boolean;
  size?: "small";
  position?: "top" | "bottom" | "left" | "right";
  textAlign?: "left" | "center" | "right";
  children?: ReactNode;
  bold?: boolean;
  disabled?: boolean;
}

interface StyledTooltipProps extends TooltipProps {
  size?: "small";
  textAlign?: "left" | "center" | "right";
  bold?: boolean;
}

const StyledTooltip = styled(
  ({ className, size, textAlign, bold, ...props }: StyledTooltipProps) => (
    <MuiTooltip {...props} classes={{ popper: className }} />
  ),
  {
    shouldForwardProp: (prop) =>
      prop !== "size" && prop !== "textAlign" && prop !== "bold",
  },
)<StyledTooltipProps>(({ size, textAlign, bold }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    maxWidth: size === "small" ? "120px" : "200px",
    display: "flex",
    flexDirection: "row",
    justifyContent:
      size === "small" || textAlign === "center"
        ? "center"
        : textAlign === "right"
          ? "flex-end"
          : "flex-start",
    alignItems: "center",
    boxShadow: "0px 1px 6px 0px rgba(0, 0, 0, 0.25)",
    flexGrow: 0,
    fontFamily: Fonts.main,
    fontSize: "12px",
    fontWeight: bold ? 700 : 400,
    fontStretch: "normal",
    fontStyle: "normal",
    lineHeight: "normal",
    letterSpacing: "normal",
    textAlign: size === "small" ? "center" : textAlign ?? "left",
    color: bold ? Colors.lightBlack : "#959fa9",
    padding: "8px 10px",
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  [`& .${tooltipClasses.arrow}:before`]: {
    position: "relative",
    boxSizing: "border-box",
    background: "#fff",
    boxShadow: "0.1px -0.5px 3px 0.2px rgba(0, 0, 0, 0.25)",
  },
}));

const IconImage = styled.img<{
  iconWidth?: string;
  iconHeight?: string;
  disabled?: boolean;
}>(({ iconWidth, iconHeight, disabled }) => ({
  cursor: !disabled ? "pointer" : "not-allowed",
  width: iconWidth || "24px",
  height: iconHeight || "24px",
}));

const Tooltip = memo(
  ({
    detail,
    icon,
    iconWidth,
    iconHeight,
    withoutIcon,
    children,
    size,
    position,
    textAlign,
    bold,
    disabled,
  }: Props) => {
    return (
      <StyledTooltip
        title={detail}
        placement={position ?? (withoutIcon ? "top" : "left")}
        arrow
        size={size}
        textAlign={textAlign}
        bold={bold}
      >
        {withoutIcon ? (
          <span style={{ display: "inline-flex" }}>{children}</span>
        ) : (
          <IconImage
            src={icon}
            //alt={detail}
            iconHeight={iconHeight}
            iconWidth={iconWidth}
            disabled={disabled}
          />
        )}
      </StyledTooltip>
    );
  },
);

export default Tooltip;

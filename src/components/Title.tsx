import styled from "@emotion/styled";
import { Box, Grid } from "@mui/system";
import { memo, type ReactNode } from "react";
import Divider from "./Divider";
import { Colors, Fonts } from "../theme";

export interface TitleProps {
  title?: string;
  children?: ReactNode;
  showDivider?: boolean;
  margin?: boolean;
  bold?: boolean;
  marginBottom?: string;
  titleWithSubtitle?: boolean;
  smallText?: boolean;
}

const TitleContent = styled("div")<{
  margin: boolean;
  bold: boolean;
  titleWithSubtitle: boolean;
  smallText: boolean;
}>(({ margin, bold, titleWithSubtitle, smallText }) => ({
  flexGrow: 0,
  fontFamily: Fonts.main,
  fontSize: smallText ? 20 : 28,
  fontWeight: bold ? 900 : 500,
  lineHeight: smallText ? 1.56 : "normal",
  letterSpacing: 0.56,
  color: Colors.lightBlack,
  ...(margin && {
    marginTop: "12px",
    marginBottom: "17px",
    marginRight: "16px",
    marginLeft: "16px",
  }),
  ...(titleWithSubtitle && {
    display: "flex",
    alignItems: "center",
  }),
  ...(smallText && {
    fontSize: 20,
    lineHeight: 1.56,
    margin: "15px 0px 16px 16px",
  }),
}));

const TitleContainer = ({
  title,
  margin = true,
  bold = false,
  titleWithSubtitle = false,
  smallText = false,
}: TitleProps) => {
  return (
    <TitleContent
      smallText={smallText}
      titleWithSubtitle={titleWithSubtitle}
      bold={bold}
      margin={margin}
    >
      {title}
    </TitleContent>
  );
};

const Title = memo(
  ({
    title,
    children,
    showDivider = true,
    margin = true,
    bold = false,
    marginBottom,
    titleWithSubtitle = false,
    smallText = false,
  }: TitleProps) => {
    return (
      <Box
        sx={{
          flexGrow: 1,
        }}
      >
        <Grid container alignItems={"center"}>
          <Grid sx={{ flexGrow: "1" }} display={"flex"} alignItems={"center"}>
            <TitleContainer
              title={title || ""}
              margin={margin}
              bold={bold}
              titleWithSubtitle={titleWithSubtitle}
              smallText={smallText}
            />
          </Grid>
          <Box display={"flex"}>{children}</Box>
        </Grid>
        {showDivider && <Divider marginBottom={marginBottom} />}
      </Box>
    );
  },
);

export default Title;

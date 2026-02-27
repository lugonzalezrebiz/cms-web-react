import styled from "@emotion/styled";
import { Box, Grid } from "@mui/system";
import { memo, type ReactNode } from "react";
import Tooltip from "./Tooltip";
import Divider from "./Divider";
import { Colors, Fonts } from "../theme";
import { useMediaQuery } from "@mui/material";

export interface TitleProps {
  title?: string;
  tooltipIcon?: string;
  tooltipDetail?: ReactNode;
  subTitle?: string;
  children?: ReactNode;
  showDivider?: boolean;
  subTitleComplement?: string;
  margin?: boolean;
  bold?: boolean;
  iconComplement?: ReactNode;
  calendarComplement?: ReactNode;
  marginBottom?: string;
  firstComplement?: ReactNode;
  titleWithSubtitle?: boolean;
  smallText?: boolean;
  isXS?: boolean;
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

const ImageContent = styled.div({
  flexGrow: 0,
  fontFamily: Fonts.main,
  fontSize: 28,
  fontWeight: 900,
  lineHeight: "normal",
  letterSpacing: 0.56,
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  marginRight: "16px",
  textAlign: "right",
  color: Colors.black,
  marginBottom: "-4px",
});

const SubTitle = styled("p")({
  margin: "1px 0 0 4px",
  fontFamily: Fonts.main,
  fontSize: 16,
  fontWeight: 400,
  color: Colors.dimGray,
  lineHeight: 1.56,
});

const FirstComplement = styled.div({});

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

const TitleWithSubtitle = ({
  title,
  subTitle,
  margin = true,
  bold = false,
  smallText = false,
}: TitleProps) => {
  return (
    <Box
      display={"flex"}
      alignItems={{ xs: "flex-start", sm: "flex-start" }}
      width={"100%"}
      flexDirection={{ xs: "row", sm: "row", md: "row", lg: "row" }}
    >
      <TitleContent
        smallText={smallText}
        titleWithSubtitle
        bold={bold}
        margin={margin}
      >
        {title}
      </TitleContent>
      <Box
        margin={{
          xs: "19px 0 0 0",
          sm: "19px 0 0 0",
          md: "19px 0 0 0",
          lg: "19px 0 0 0",
        }}
      >
        <SubTitle>{subTitle}</SubTitle>
      </Box>
    </Box>
  );
};

const IconComplementContainer = ({
  iconComplement,
  titleWithSubtitle,
  smallText,
}: TitleProps) => {
  return (
    <Box
      display={"flex"}
      margin={"0 14px"}
      marginBottom={{
        xs:
          iconComplement && titleWithSubtitle && smallText
            ? "0px"
            : iconComplement
              ? "0px"
              : "8px",
        sm: "0",
        md: "0",
        lg: "0",
        xl: "0",
      }}
    >
      {iconComplement}
    </Box>
  );
};

const CalendarComplementContainer = ({
  calendarComplement,
  titleWithSubtitle,
  smallText,
  isXS,
}: TitleProps) => {
  return (
    <Box
      display={"flex"}
      margin={{
        xs: "0 14px",
        sm: "0 -20px 0 0",
      }}
      marginBottom={{
        xs:
          calendarComplement && titleWithSubtitle && smallText
            ? "0px"
            : calendarComplement && !isXS
              ? "0px"
              : isXS
                ? "8px"
                : "8px",
        sm: "0",
        md: "0",
        lg: "0",
        xl: "0",
      }}
    >
      {calendarComplement}
    </Box>
  );
};

const TooltipContainer = ({
  tooltipIcon,
  tooltipDetail,
  smallText,
  titleWithSubtitle,
  iconComplement,
}: TitleProps) => {
  return (
    <Box
      display={"flex"}
      alignItems={"center"}
      marginBottom={{
        xs:
          iconComplement && titleWithSubtitle && smallText
            ? "0px"
            : iconComplement
              ? "0px"
              : "8px",
        sm: "0",
        md: "0",
        lg: "0",
        xl: "0",
      }}
    >
      <ImageContent>
        <Tooltip icon={tooltipIcon} detail={tooltipDetail} />
      </ImageContent>
    </Box>
  );
};

const Title = memo(
  ({
    title,
    tooltipIcon,
    tooltipDetail,
    subTitle,
    children,
    showDivider = true,
    margin = true,
    bold = false,
    iconComplement,
    calendarComplement,
    firstComplement,
    marginBottom,
    titleWithSubtitle = false,
    smallText = false,
  }: TitleProps) => {
    const isXS = useMediaQuery("(min-width:0px) and (max-width:599px)");

    const showTooltip = tooltipIcon && tooltipDetail;
    const iconComplementExits = iconComplement && !titleWithSubtitle;

    const layoutTitleSize = iconComplementExits
      ? { xs: 9, sm: 7, md: 7, lg: 7, xl: 7 }
      : iconComplement && titleWithSubtitle && smallText
        ? { xs: 9, sm: 8, md: 10, lg: 8, xl: 7 }
        : { xs: 11, sm: 11, md: 11, lg: 11, xl: 11 };
    const layoutTooltipSize = iconComplementExits
      ? { xs: 3, sm: 5, md: 5, lg: 5, xl: 5 }
      : iconComplement && titleWithSubtitle && smallText
        ? { xs: 3, sm: 4, md: 2, lg: 4, xl: 5 }
        : { xs: 1, sm: 1, md: 1, lg: 1, xl: 1 };

    return (
      <Box
        sx={{
          flexGrow: 1,
        }}
      >
        <Grid container>
          <Grid
            size={layoutTitleSize}
            sx={{ flexGrow: "1" }}
            display={"flex"}
            alignItems={"center"}
          >
            {firstComplement && (
              <FirstComplement>{firstComplement}</FirstComplement>
            )}

            {titleWithSubtitle ? (
              <TitleWithSubtitle
                title={title}
                subTitle={subTitle}
                margin={margin}
                bold={bold}
                smallText={smallText}
              />
            ) : (
              <TitleContainer
                title={title || ""}
                margin={margin}
                bold={bold}
                titleWithSubtitle={titleWithSubtitle}
                smallText={smallText}
              />
            )}
          </Grid>
          {isXS && calendarComplement
            ? showTooltip && (
                <>
                  <Grid
                    size={layoutTooltipSize}
                    display={"flex"}
                    alignItems={"center"}
                    justifyContent={{
                      xs:
                        iconComplement && titleWithSubtitle && smallText
                          ? "flex-end"
                          : iconComplement
                            ? "flex-end"
                            : "space-between",
                      sm: "flex-end",
                      md: "flex-end",
                      lg: "flex-end",
                      xl: "flex-end",
                    }}
                  >
                    {iconComplement && (
                      <IconComplementContainer
                        titleWithSubtitle={titleWithSubtitle}
                        smallText={smallText}
                        iconComplement={iconComplement}
                      />
                    )}
                    <TooltipContainer
                      titleWithSubtitle={titleWithSubtitle}
                      smallText={smallText}
                      iconComplement={iconComplement}
                      tooltipIcon={tooltipIcon}
                      tooltipDetail={tooltipDetail}
                    />
                  </Grid>
                  <>
                    {calendarComplement && (
                      <Grid margin={"-10px 0 0 0"}>
                        <CalendarComplementContainer
                          isXS={isXS}
                          titleWithSubtitle={titleWithSubtitle}
                          smallText={smallText}
                          calendarComplement={calendarComplement}
                        />
                      </Grid>
                    )}
                  </>
                </>
              )
            : showTooltip && (
                <Grid
                  size={layoutTooltipSize}
                  display={"flex"}
                  alignItems={"center"}
                  justifyContent={{
                    xs:
                      iconComplement && titleWithSubtitle && smallText
                        ? "flex-end"
                        : iconComplement
                          ? "flex-end"
                          : "space-between",
                    sm: "flex-end",
                    md: "flex-end",
                    lg: "flex-end",
                    xl: "flex-end",
                  }}
                >
                  {calendarComplement && (
                    <CalendarComplementContainer
                      isXS={isXS}
                      titleWithSubtitle={titleWithSubtitle}
                      smallText={smallText}
                      calendarComplement={calendarComplement}
                    />
                  )}
                  {iconComplement && (
                    <IconComplementContainer
                      titleWithSubtitle={titleWithSubtitle}
                      smallText={smallText}
                      iconComplement={iconComplement}
                    />
                  )}
                  <TooltipContainer
                    titleWithSubtitle={titleWithSubtitle}
                    smallText={smallText}
                    iconComplement={iconComplement}
                    tooltipIcon={tooltipIcon}
                    tooltipDetail={tooltipDetail}
                  />
                </Grid>
              )}

          <Box>{children}</Box>
        </Grid>
        {showDivider && <Divider marginBottom={marginBottom} />}
      </Box>
    );
  },
);

export default Title;

import type React from "react";
import { Grid } from "@mui/system";
import styled from "@emotion/styled";
import { Box } from "@mui/material";
import { Colors, Fonts } from "../../../theme";
import Card from "../../../components/Card";
import Divider from "../../../components/Divider";

const Current = styled("p")({
  fontFamily: Fonts.main,
  fontSize: "36px",
  fontWeight: 700,
  lineHeight: "44px",
  letterSpacing: "-0.72px",
  margin: "6px 0px 3px 0px",
  padding: "0px",
  transition: "all 0.3s ease",
});

const CardTitle = styled("p")({
  margin: "0px 8px 0px 0px ",
  padding: "0px",
  fontSize: "15px",
  fontWeight: "600",
  fontFamily: Fonts.main,
  linHeight: "24px",
  color: Colors.dimGray,
  width: "100%",
  opacity: 0.7,
  whiteSpace: "nowrap",
});

const CardContainer = styled(Grid)({
  padding: "16px ",
  backgroundColor: Colors.white,
});

const CardTitleContainer = styled(Grid)({
  display: "flex",
  alignItems: "center",
  alignContent: "center",
});

const MediaContainer = styled(Box)({
  position: "relative",
  width: "100%",
  height: "45px",
});

interface HeaderCardProps {
  title: string;
  image: string;
  current: number;
}

const HeaderCard = ({ title, current = 0, image }: HeaderCardProps) => {
  return (
    <Card>
      <CardContainer>
        <CardTitleContainer sx={{ height: "24px" }}>
          <CardTitle>{title || "No data available"}</CardTitle>
          <MediaContainer>
            <Box
              component="img"
              src={image}
              alt=""
              sx={{
                position: "absolute",
                top: "0px",
                right: "1px",
                width: "73px",
                height: "67px",
              }}
            />
          </MediaContainer>
        </CardTitleContainer>
        <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12 }}>
          <Current>{current}</Current>
        </Grid>
      </CardContainer>
    </Card>
  );
};

export type stateAssignments =
  | "Ready"
  | "Assigned"
  | "Started"
  | "Paused"
  | "Resumed"
  | "Completed"
  | "Error"
  | "Reported";

export const stateColors: Record<
  stateAssignments,
  { border: string; bg: string; color: string }
> = {
  Ready: {
    border: Colors.leafGreen,
    bg: Colors.mintFoam,
    color: Colors.leafGreen,
  },
  Completed: {
    border: Colors.leafGreen,
    bg: Colors.mintFoam,
    color: Colors.leafGreen,
  },
  Paused: {
    border: Colors.goldenAmber,
    bg: Colors.creamYellow,
    color: Colors.goldenAmber,
  },
  Started: {
    border: Colors.goldenAmber,
    bg: Colors.creamYellow,
    color: Colors.goldenAmber,
  },
  Resumed: {
    border: Colors.goldenAmber,
    bg: Colors.creamYellow,
    color: Colors.goldenAmber,
  },
  Assigned: {
    border: Colors.royalBlue,
    bg: Colors.lightSkyBlue,
    color: Colors.royalBlue,
  },
  Reported: {
    border: Colors.royalBlue,
    bg: Colors.lightSkyBlue,
    color: Colors.royalBlue,
  },
  Error: {
    border: Colors.blushRed,
    bg: Colors.palePink,
    color: Colors.blushRed,
  },
};

interface AssignmentCardProps {
  state: stateAssignments;
  location?: number;
  store?: number;
  date?: string;
  comments?: number;
  onClick?: () => void;
  openMenu?: (e: React.MouseEvent<HTMLElement>) => void;
}

const AssignmentSubText = styled("p")({
  fontFamily: Fonts.main,
  fontSize: "14px",
  fontWeight: 400,
  color: Colors.lightBlack,
});

const AssignmentTitle = styled("p")({
  fontFamily: Fonts.main,
  fontSize: "20px",
  fontWeight: 700,
  color: Colors.lightBlack,
  margin: "0 0px 16px 0px",
  lineHeight: "30px",
});

const AssignmentComments = styled("p")({
  fontFamily: Fonts.main,
  fontSize: "14px",
  fontWeight: 400,
  color: Colors.lightOrange,
  margin: "0 0px 0 6px",
});

export const NewAssignmentsCard = ({
  state,
  location,
  store,
  date,
  comments,
  onClick,
  openMenu,
}: AssignmentCardProps) => {
  return (
    <Card
      bgcolor={Colors.white}
      padding={"16px"}
      borderRadius={"16px"}
      onClick={onClick}
      sx={{ cursor: onClick ? "pointer" : "default" }}
    >
      <Box
        display={"flex"}
        alignItems={"center"}
        justifyContent={"space-between"}
        position={"relative"}
        m={"0px 0px 20px 0px"}
      >
        <Box
          sx={{
            p: "2px 16px",
            border: `1px solid ${stateColors[state].border}`,
            borderRadius: "20px",
            bgcolor: stateColors[state].bg,
            color: stateColors[state].color,
            fontFamily: Fonts.main,
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          {state}
        </Box>
        <img
          style={{
            position: "absolute",
            right: "16px",
            cursor: "pointer",
            padding: "4px",
          }}
          src="./assets/dots-vertical.svg"
          alt="More options"
          onClick={(e) => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
            openMenu?.(e);
          }}
        />
      </Box>
      <Box display={"flex"}>
        <img
          style={{ margin: "0 6px 0 0" }}
          src="./assets/building-07.svg"
          alt="Location"
        />
        <AssignmentSubText style={{ margin: "0 16px 0 0" }}>
          {location}
        </AssignmentSubText>
        <img
          style={{ margin: "0 6px 0 0" }}
          src="./assets/building-02.svg"
          alt="Store"
        />
        <AssignmentSubText style={{ margin: 0 }}>{store}</AssignmentSubText>
      </Box>
      <Box>
        <AssignmentTitle>{date}</AssignmentTitle>
        <Divider marginBottom="10px" />
      </Box>
      <Box display={"flex"} alignItems={"center"}>
        <img src="./assets/message-text-square-01.svg" alt="Comments" />
        <AssignmentComments>
          <span style={{ color: Colors.vividOrange }}>{comments}</span> Comments
        </AssignmentComments>
      </Box>
    </Card>
  );
};

export default HeaderCard;

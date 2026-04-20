import { Box } from "@mui/system";
import { Colors, Fonts } from "../theme";
import styled from "@emotion/styled";
import Tooltip from "./Tooltip";
import type { ReactNode } from "react";

const ProgressBarText = styled("span")({
  fontFamily: Fonts.main,
  fontSize: "16px",
  fontWeight: 600,
  marginRight: "4px",
  display: "flex",
  justifyContent: "flex-end",
});

interface Props {
  value: number;
  tooltip: ReactNode;
}

const ProgressBar = ({ value, tooltip }: Props) => {
  return (
    <Box width="100%" display="flex" alignItems="center">
      <Box width="65px" textAlign="right">
        <ProgressBarText style={{ color: Colors.dimGray }}>
          {value}%
        </ProgressBarText>
      </Box>
      <Box flex={1}>
        <Tooltip withoutIcon={true} detail={tooltip} position="top">
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: "24px",
              backgroundColor: Colors.verylightgrayishblue,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                //width: `${value}%`,
                width: value === 0 ? "0.5%" : `${value}%`,
                backgroundColor: Colors.softTangerine,
                borderTopRightRadius: "4px",
                borderBottomRightRadius: "4px",
              }}
            />
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default ProgressBar;

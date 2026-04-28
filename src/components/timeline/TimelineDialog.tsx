import { useState } from "react";
import { Box, Grid } from "@mui/system";
import Dialog from "../Dialog";
import { Colors, Fonts } from "../../theme";
import styled from "@emotion/styled";
import Button from "../Button";
import { PEOPLE, TABS_DIALOG } from "./constants";

interface Props {
  openDialog?: boolean;
  dialogOnClose?: () => void;
}

const TabsStyled = styled(Box)<{ selected?: boolean }>(({ selected }) => ({
  backgroundColor: selected ? Colors.vividOrange : Colors.white,
  padding: "8px 16px",
  color: selected ? Colors.white : Colors.lightBlack,
  fontFamily: Fonts.main,
  width: "100px",
  display: "flex",
  alignItems: "center",
  flexDirection: "column",
  lineHeight: "20px",
  fontSize: "14px",
  borderRadius: "4px",
  gap: "5px",
  cursor: "pointer",
}));

const ContainerText = styled(Box)<{ selected?: boolean }>(({ selected }) => ({
  padding: "8px 16px",
  backgroundColor: selected ? Colors.blushWhite : "transparent",
  borderRadius: "4px",
  cursor: "pointer",
  "&:hover": {
    backgroundColor: Colors.blushWhite,
  },
}));

const CamaraIconContainer = styled(Box)<{ selected?: boolean }>(
  ({ selected }) => ({
    padding: "10px",
    width: "39px",
    height: "33px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    border: selected
      ? `1px solid ${Colors.vividOrange}`
      : "1px solid transparent",
    cursor: "pointer",
  }),
);

const NameText = styled("p")({
  color: Colors.lightBlack,
  fontFamily: Fonts.main,
  fontSize: "14px",
  lineHeight: "20px",
  fontWeight: 700,
  margin: "0",
});

const SubText = styled("p")({
  color: Colors.lightBlack,
  fontFamily: Fonts.main,
  fontSize: "14px",
  lineHeight: "20px",
  fontWeight: 400,
  margin: "0",
});

const Media = styled("img")<{ selected?: boolean }>(({ selected }) => ({
  filter: selected ? "brightness(0) invert(1)" : "none",
}));

const TimelineDialog = ({ openDialog = false, dialogOnClose }: Props) => {
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedPerson, setSelectedPerson] = useState<number | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<number | null>(null);

  return (
    <Dialog
      bgColor={Colors.softWhite}
      open={openDialog}
      onClose={dialogOnClose || (() => {})}
      footer={
        <>
          <Button onClick={dialogOnClose} outfit color="secondary">
            Cancel
          </Button>
          <Button outfit>Select</Button>
        </>
      }
    >
      <Grid container spacing={"16px"}>
        <Box gap={"8px"} display={"flex"}>
          {TABS_DIALOG.map((tab) => (
            <TabsStyled
              key={tab.key}
              selected={selectedTab === tab.key}
              onClick={() => setSelectedTab(tab.key)}
            >
              <Media src={tab.icon} alt="" selected={selectedTab === tab.key} />
              {tab.label}
            </TabsStyled>
          ))}
        </Box>
        <Grid
          container
          sx={{ border: `1px solid ${Colors.silverGrey}`, borderRadius: "8px" }}
        >
          <Grid
            sx={{
              bgcolor: Colors.white,
              borderTopLeftRadius: "8px",
              borderBottomLeftRadius: "8px",
              height: "364px",
              width: "200px",
              overflowY: "auto",
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {PEOPLE.map((person, i) => (
              <ContainerText
                key={i}
                selected={selectedPerson === i}
                onClick={() => setSelectedPerson(i)}
              >
                <NameText>{person.name}</NameText>
                <SubText>{person.lastSeen}</SubText>
                <SubText>{person.role}</SubText>
              </ContainerText>
            ))}
          </Grid>
          <Grid container p={"8px"}>
            <Grid container flexDirection={"column"}>
              {[0, 1, 2, 3].map((i) => (
                <CamaraIconContainer
                  key={i}
                  bgcolor={Colors.blushWhite}
                  selected={selectedCamera === i}
                  onClick={() => setSelectedCamera(i)}
                >
                  <img src="../assets/webcam-01.svg" alt="Webcam" />
                </CamaraIconContainer>
              ))}
            </Grid>
            <Grid>
              <Box width={"533px"} height={"348px"}>
                <img
                  style={{
                    height: "100%",
                    width: "100%",
                    backgroundColor: Colors.blushWhite,
                  }}
                  src="../assets/camera/Cam thumbnail.svg"
                  alt="Camera thumbnail"
                />
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Dialog>
  );
};

export default TimelineDialog;

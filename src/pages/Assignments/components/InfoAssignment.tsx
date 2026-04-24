import { Box } from "@mui/system";
import Dialog from "../../../components/Dialog";
import { Colors, Fonts } from "../../../theme";
import styled from "@emotion/styled";

export type Assignment = {
  state: stateAssignments;
  location: number;
  store: number;
  date: string;
  comments: number;
  items: { activity: string; complement: string }[];
  commentsTex: string[];
};

interface InfoAssignmentProps {
  handleCloseDialog: () => void;
  dialogOpen: boolean;
  selectedAssignment: Assignment | null;
}

type stateAssignments = "Paused" | "New" | "Resolved" | "Rejected";

const stateColors: Record<
  stateAssignments,
  { border: string; bg: string; color: string }
> = {
  New: {
    border: Colors.leafGreen,
    bg: Colors.mintFoam,
    color: Colors.leafGreen,
  },
  Paused: {
    border: Colors.goldenAmber,
    bg: Colors.creamYellow,
    color: Colors.goldenAmber,
  },
  Resolved: {
    border: Colors.royalBlue,
    bg: Colors.lightSkyBlue,
    color: Colors.royalBlue,
  },
  Rejected: {
    border: Colors.blushRed,
    bg: Colors.palePink,
    color: Colors.blushRed,
  },
};

const AssignmentSubText = styled("p")({
  fontFamily: Fonts.main,
  fontSize: "14px",
  fontWeight: 400,
  color: Colors.lightBlack,
  lineHeight: 1.43,
});

const AssignmentTitle = styled("p")({
  fontFamily: Fonts.main,
  fontSize: "20px",
  fontWeight: 700,
  color: Colors.lightBlack,
  margin: "0 0px 8px 0px",
  lineHeight: 1.5,
});

const MenuHeaderContainer = styled(Box)({
  display: "flex",
  padding: "8px 0",
  alignItems: "center",
  gap: "10px",
  justifyContent: "space-between",
  borderBottom: `1px solid ${Colors.paleGray}`,
});

const TextHeaderMenu = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "14px",
  fontWeight: "normal",
  lineHeight: 1.5,
  color: Colors.lightBlack,
  textAlign: "left",
});

const SubTextHeaderMenu = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "14px",
  fontWeight: "normal",
  lineHeight: 1.5,
  color: Colors.dimGray,
  textAlign: "left",
});

const TextComments = styled("p")({
  margin: "16px 0 8px 0",
  fontFamily: Fonts.main,
  fontSize: "14px",
  lineHeight: 1.43,
  color: Colors.lightBlack,
  textAlign: "left",
  fontWeight: 700,
});

const Comments = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "14px",
  lineHeight: 1.43,
  color: Colors.lightBlack,
  textAlign: "left",
  fontWeight: 400,
});

const InfoAssignment = ({
  handleCloseDialog,
  dialogOpen,
  selectedAssignment,
}: InfoAssignmentProps) => {
  return (
    <Dialog
      onClose={handleCloseDialog}
      open={dialogOpen}
      maxWidth="364px"
      padding="24px 24px 24px 24px"
    >
      <Box position={"relative"}>
        <Box
          onClick={handleCloseDialog}
          sx={{ position: "absolute", top: 0, right: 0, cursor: "pointer" }}
        >
          <img src="./assets/x-close.svg" alt="" />
        </Box>
        {selectedAssignment && (
          <>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <img
                style={{ margin: "0 6px 0 0" }}
                src="./assets/building-07.svg"
                alt=""
              />
              <AssignmentSubText style={{ margin: "0 18px 0 0" }}>
                {selectedAssignment.location}
              </AssignmentSubText>
              <img
                style={{ margin: "0 6px 0 0" }}
                src="./assets/building-02.svg"
                alt=""
              />
              <AssignmentSubText style={{ margin: 0 }}>
                {selectedAssignment.store}
              </AssignmentSubText>
            </Box>
            <Box display={"flex"} flexDirection={"row"} alignItems={"center"}>
              <AssignmentTitle>{selectedAssignment.date}</AssignmentTitle>
              <Box
                sx={{
                  p: "4px 16px",
                  border: `1px solid ${stateColors[selectedAssignment.state].border}`,
                  borderRadius: "20px",
                  bgcolor: stateColors[selectedAssignment.state].bg,
                  color: stateColors[selectedAssignment.state].color,
                  fontFamily: Fonts.main,
                  fontSize: "12px",
                  fontWeight: 700,
                  ml: "7px",
                  display: "flex",
                  alignItems: "center",
                  mb: "8px",
                }}
              >
                {selectedAssignment.state}
              </Box>
            </Box>
            <Box>
              {selectedAssignment.items.map((item, index) => (
                <MenuHeaderContainer
                  key={index}
                  sx={{ mt: index === 0 ? "8px" : undefined }}
                >
                  <TextHeaderMenu>{item.activity}</TextHeaderMenu>
                  <SubTextHeaderMenu>{item.complement}</SubTextHeaderMenu>
                </MenuHeaderContainer>
              ))}
            </Box>
            <Box>
              <TextComments>
                <span style={{ marginRight: "8px" }}>
                  {selectedAssignment.commentsTex.length}
                </span>
                Comments:
              </TextComments>
              <Box
                component="ol"
                sx={{
                  "& li::marker": {
                    content: "counter(list-item)",
                    fontFamily: Fonts.main,
                    fontWeight: "bold",
                    fontSize: "14px",
                  },
                  margin: "0 0 0 7px",
                  padding: 0,
                }}
              >
                {selectedAssignment.commentsTex.map((comment, index) => (
                  <li key={index}>
                    <Comments style={{ margin: "8px 0 8px 8px" }}>
                      {comment}
                    </Comments>
                  </li>
                ))}
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Dialog>
  );
};

export default InfoAssignment;

import { Box } from "@mui/system";
import Dialog from "../../../components/Dialog";
import { Colors, Fonts } from "../../../theme";
import styled from "@emotion/styled";
import { type stateAssignments, stateColors } from "./stateColors";

export type Assignment = {
  state: stateAssignments;
  statusID: number;
  location: number;
  store: number;
  date: string;
  comments: number;
  monitoringID: string;
  items: { activity: string; complement: string }[];
  commentsTex: string[];
};

interface InfoAssignmentProps {
  handleCloseDialog: () => void;
  dialogOpen: boolean;
  selectedAssignment: Assignment | null;
}

const AssignmentSubText = styled("p")({
  fontFamily: Fonts.main,
  fontSize: "14px",
  fontWeight: 400,
  color: Colors.charcoalNavy,
  lineHeight: 1.43,
});

const AssignmentTitle = styled("p")({
  fontFamily: Fonts.main,
  fontSize: "20px",
  fontWeight: 700,
  color: Colors.charcoalNavy,
  margin: "0 0px 0px 0px",
  lineHeight: 1.5,
});

const MenuHeaderContainer = styled(Box)({
  display: "flex",
  padding: "8px 0",
  alignItems: "center",
  gap: "10px",
  justifyContent: "space-between",
  borderBottom: `1px solid ${Colors.paleGray}`,
  height: "24px",
});

const TextHeaderMenu = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "14px",
  lineHeight: 1.43,
  color: Colors.lightBlack,
  textAlign: "left",
  height: "20px",
  fontWeight: 400,
});

const SubTextHeaderMenu = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "16px",
  fontWeight: 400,
  lineHeight: 1.5,
  color: Colors.dimGray,
  textAlign: "left",
  height: "24px",
});

const TextComments = styled("p")({
  margin: "16px 0 8px 0",
  fontFamily: Fonts.main,
  fontSize: "14px",
  lineHeight: 1.43,
  color: Colors.charcoalNavy,
  textAlign: "left",
  fontWeight: 600,
  height: "20px",
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
      padding="24px"
    >
      <Box>
        <Box
          onClick={handleCloseDialog}
          sx={{ position: "absolute", top: 8, right: 10, cursor: "pointer" }}
        >
          <img src="./assets/x-close.svg" alt="Close" />
        </Box>
        {selectedAssignment && (
          <>
            <Box height={"20px"} sx={{ display: "flex", alignItems: "center" }}>
              <img
                style={{ margin: "0 6px 0 0" }}
                src="./assets/building-07.svg"
                alt="Location"
              />
              <AssignmentSubText style={{ margin: "0 18px 0 0" }}>
                {selectedAssignment.location}
              </AssignmentSubText>
              <img
                style={{ margin: "0 6px 0 0" }}
                src="./assets/building-02.svg"
                alt="Store"
              />
              <AssignmentSubText style={{ margin: 0 }}>
                {selectedAssignment.store}
              </AssignmentSubText>
            </Box>
            <Box
              height={"30px"}
              display={"flex"}
              flexDirection={"row"}
              alignItems={"center"}
            >
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
                  ml: "8px",
                  display: "flex",
                  alignItems: "center",
                  // mb: "8px",
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
                <span style={{ marginRight: "4px" }}>
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

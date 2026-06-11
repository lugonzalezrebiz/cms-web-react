import { Box } from "@mui/system";
import { Colors, Fonts } from "../../../theme";
import styled from "@emotion/styled";
import type { Assignment } from "../../../hooks/useAssignments";
import FormDialog from "../../../components/FormDialog";


interface InfoAssignmentProps {
  handleCloseDialog: () => void;
  dialogOpen: boolean;
  selectedAssignment: Assignment | null;
}


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
    <FormDialog
      open={dialogOpen}
      onClose={handleCloseDialog}
      maxWidth="364px"
      padding="24px"
      assignment={selectedAssignment ?? undefined}
    >
      {selectedAssignment && (
        <Box>
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
        </Box>
      )}
    </FormDialog>
  );
};

export default InfoAssignment;

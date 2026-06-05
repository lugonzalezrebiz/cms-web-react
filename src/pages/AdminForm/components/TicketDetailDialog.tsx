import { Box } from "@mui/material";
import styled from "@emotion/styled";
import { useMarkTicketResolved } from "../hooks/useMarkTicketResolved";
import { Colors, Fonts } from "../../../theme";
import FormDialog from "../../../components/FormDialog";
import Button from "../../../components/Button";
import {
  formatTicketDateWithTime,
  formatTicketDate,
} from "../utils/formatTicketDate";
import { normalizeTicketState } from "../../../components/stateColors";
import type { Ticket } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  ticket: Ticket;
}

const RowLabel = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "16px",
  fontWeight: 400,
  color: Colors.lightBlack,
  lineHeight: 1.43,
});

const RowValue = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "16px",
  fontWeight: 400,
  color: Colors.dimGray,
  textAlign: "right",
  lineHeight: 1.5,
});

const DescriptionTitle = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "14px",
  fontWeight: 600,
  color: Colors.charcoalNavy,
});

const DescriptionText = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "14px",
  fontWeight: 400,
  color: Colors.charcoalNavy,
  lineHeight: 1.43,
});

const TicketDetailDialog = ({ open, onClose, ticket }: Props) => {
  const { markAsResolved } = useMarkTicketResolved();
  return (
    <FormDialog
      open={open}
      onClose={onClose}
      maxWidth="364px"
      padding="24px"
      assignment={{
        location: ticket.locationID,
        store: ticket.companyID,
        date: formatTicketDate(ticket.createDate),
        state: normalizeTicketState(ticket.status ?? ""),
      }}
    >
      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: "8px 0",
          }}
        >
          <RowLabel>Issue Type</RowLabel>
          <RowValue>{ticket.issueTypeName}</RowValue>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: "8px 0",
          }}
        >
          <RowLabel>Reported</RowLabel>
          <RowValue>{formatTicketDateWithTime(ticket.createDate)}</RowValue>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <DescriptionTitle>Description Provided</DescriptionTitle>
        <DescriptionText>{ticket.description}</DescriptionText>
      </Box>

      {ticket.status?.toLowerCase() !== "resolved" && (
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            fontSize="14px"
            sx={{ height: "40px", borderRadius: "20px", px: "24px" }}
            color="primary"
            outfit
            onClick={() => {
              markAsResolved(ticket.id);
              onClose();
            }}
          >
            Mark as Resolved
          </Button>
        </Box>
      )}
    </FormDialog>
  );
};

export default TicketDetailDialog;

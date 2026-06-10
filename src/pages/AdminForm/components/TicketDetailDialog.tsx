import { Box } from "@mui/material";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../../../theme";
import FormDialog from "../../../components/FormDialog";
import Button from "../../../components/Button";
import {
  formatTicketDateWithTime,
  formatTicketDate,
} from "../utils/formatTicketDate";
import type { stateAssignments } from "../../../components/stateColors";

interface Ticket {
  id: number;
  location: number;
  store: number;
  reported: string;
  issueType: string;
  createdBy: string;
  description: string;
  status: stateAssignments;
}

interface Props {
  open: boolean;
  onClose: () => void;
  ticket: Ticket;
  onMarkAsResolved?: (ticketId: number) => void;
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

const TicketDetailDialog = ({
  open,
  onClose,
  ticket,
  onMarkAsResolved,
}: Props) => {
  return (
    <FormDialog
      open={open}
      onClose={onClose}
      maxWidth="364px"
      padding="24px"
      assignment={{
        location: ticket.location,
        store: ticket.store,
        date: formatTicketDate(ticket.reported),
        state: ticket.status,
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
          <RowValue>{ticket.issueType}</RowValue>
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
          <RowValue>{formatTicketDateWithTime(ticket.reported)}</RowValue>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <DescriptionTitle>Description Provided</DescriptionTitle>
        <DescriptionText>{ticket.description}</DescriptionText>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          fontSize="14px"
          sx={{ height: "40px", borderRadius: "20px", px: "24px" }}
          color="primary"
          outfit
          onClick={() => {
            onMarkAsResolved?.(ticket.id);
            onClose();
          }}
        >
          Mark as Resolved
        </Button>
      </Box>
    </FormDialog>
  );
};

export default TicketDetailDialog;

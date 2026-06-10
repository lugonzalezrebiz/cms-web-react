import { useRef, useMemo, useState } from "react";
import { Box } from "@mui/system";
import { Colors } from "../../../theme";
import Table, { type Column } from "../../../components/Table";
import Button from "../../../components/Button";
import { CustomScrollbarY } from "../../../components/CustomScrollbar";
import TicketDetailDialog from "./TicketDetailDialog";
import { formatTicketDate } from "../utils/formatTicketDate";
import Drawer from "../../../components/Drawer";
import type { Ticket } from "../types";
import { useTickets } from "../hooks/useTickets";
import { useMarkTicketResolved } from "../hooks/useMarkTicketResolved";
import StateBadge from "../../../components/StateBadge";
import { normalizeTicketState } from "../../../components/stateColors";

const formatStatusLabel = (status: string) => {
  const label =
    status.toLowerCase() === "pending_reporter" ||
    status.toLowerCase() === "pending_support"
      ? "Pending"
      : status;
  return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
};

interface TicketsDrawerProps {
  open: boolean;
  onClose: () => void;
}

const TicketsDrawer = ({ open, onClose }: TicketsDrawerProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const { tickets } = useTickets();
  const { markAsResolved, isTicketPending } = useMarkTicketResolved();

  const columns: Column[] = [
    { title: "CREATED BY", key: "createdBy", width: "90px", align: "center" },
    {
      title: "CREATED ON",
      key: "reported",
      width: "67px",
      rowColor: Colors.vividOrange,
    },
    {
      title: "STATUS",
      key: "status",
      width: "70px",
      align: "center",
      render: (status: string) => (
        <Box>
          <StateBadge
            state={normalizeTicketState(status)}
            label={formatStatusLabel(status)}
          />
        </Box>
      ),
    },
    { title: "ISSUE", key: "issue", width: "110px" },
    {
      title: "",
      key: "action",
      width: "70px",
      align: "right",
      render: ({
        id,
        status,
        isTicketPending,
      }: {
        id: number;
        status: string;
        isTicketPending: (id: number) => boolean;
      }) =>
        status.toLowerCase() === "resolved" ? null : (
          <Box>
            <Button
              square
              sx={{ height: "20px", whiteSpace: "nowrap" }}
              fontSize="11px"
              outfit
              disabled={isTicketPending(id)}
              onClick={() => markAsResolved(id)}
            >
              {isTicketPending(id) ? "LOADING..." : "RESOLVE"}
            </Button>
          </Box>
        ),
    },
  ];

  const rows = useMemo(
    () =>
      tickets.map((ticket) => ({
        id: ticket.id,
        location: ticket.locationID,
        company: ticket.companyID,
        reported: formatTicketDate(ticket.createDate),
        issue: ticket.issueTypeName,
        createdBy: ticket.createdByName,
        status: ticket.status,
        action: { id: ticket.id, status: ticket.status, isTicketPending },
      })),
    [tickets, isTicketPending],
  );

  const handleRowClick = (ticketId: number) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (ticket) setSelectedTicket(ticket);
  };

  return (
    <>
      <Drawer open={open} onClose={onClose} title="Tickets">
        <Box mt={"4px"} height={"100%"}>
          <CustomScrollbarY
            ref={scrollContainerRef}
            maxHeight="100%"
            sx={{
              width: "100%",
              borderRadius: "8px",
            }}
            bottom={0}
            thumbLength={15}
            scrollX
            xThumbLength={15}
          >
            <Table
              clickableRows="mainRow"
              columns={columns}
              rows={rows}
              onRowClick={handleRowClick}
              mainColumnWidth="80px"
              mainRowWidth="80px"
              TableCellWidth="120px"
              rowWidth="120px"
              scrollContainerRef={scrollContainerRef}
              disableOverflow
            />
          </CustomScrollbarY>
        </Box>
      </Drawer>

      {selectedTicket && (
        <TicketDetailDialog
          open={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          ticket={selectedTicket}
        />
      )}
    </>
  );
};

export default TicketsDrawer;

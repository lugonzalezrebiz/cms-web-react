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
import { MOCK_TICKETS } from "../mocks";

interface TicketsDrawerProps {
  open: boolean;
  onClose: () => void;
  tickets?: Ticket[];
  onMarkAsResolved?: (ticketId: number) => void;
}

const TicketsDrawer = ({
  open,
  onClose,
  tickets = MOCK_TICKETS,
  onMarkAsResolved,
}: TicketsDrawerProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const columns: Column[] = [
    { title: "ID", key: "id", width: "20px", align: "center" },
    { title: "LOCATION", key: "location", width: "40px", align: "center" },
    { title: "STORE", key: "store", width: "40px" },
    {
      title: "REPORTED AT",
      key: "reported",
      width: "90px",
      rowColor: Colors.vividOrange,
    },
    { title: "ISSUE", key: "issue", width: "120px" },
    {
      title: "",
      key: "action",
      width: "140px",
      align: "right",
      render: (ticketId: number) => (
        <Button
          square
          sx={{ height: "20px", whiteSpace: "nowrap" }}
          fontSize="11px"
          outfit
          onClick={() => onMarkAsResolved?.(ticketId)}
        >
          MARK AS RESOLVED
        </Button>
      ),
    },
  ];

  const rows = useMemo(
    () =>
      tickets.map((ticket) => ({
        id: ticket.id,
        location: ticket.location,
        store: ticket.store,
        reported: formatTicketDate(ticket.reported),
        issue: ticket.issueType,
        createdBy: ticket.createdBy,
        action: ticket.id,
      })),
    [tickets],
  );

  const handleRowClick = (ticketId: number) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (ticket) setSelectedTicket(ticket);
  };

  return (
    <>
      <Drawer open={open} onClose={onClose} title="Tickets">
        <Box height={"91%"}>
          <CustomScrollbarY
            ref={scrollContainerRef}
            height="100%"
            sx={{ width: "100%", bgcolor: Colors.white, borderRadius: "8px" }}
            bottom={0}
            thumbLength={15}
            scrollX
            xThumbLength={15}
          >
            <Table
              clickableRows
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
          onMarkAsResolved={onMarkAsResolved}
        />
      )}
    </>
  );
};

export default TicketsDrawer;

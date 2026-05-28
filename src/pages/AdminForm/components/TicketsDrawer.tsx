import { useRef, useMemo, useState } from "react";
import { Drawer } from "@mui/material";
import { Box } from "@mui/system";
import { Colors } from "../../../theme";
import Title from "../../../components/Title";
import Table, { type Column } from "../../../components/Table";
import Button from "../../../components/Button";
import { CustomScrollbarY } from "../../../components/CustomScrollbar";
import TicketDetailDialog from "./TicketDetailDialog";
import { formatTicketDate } from "../utils/formatTicketDate";
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

interface TicketsDrawerProps {
  open: boolean;
  onClose: () => void;
  tickets?: Ticket[];
  onMarkAsResolved?: (ticketId: number) => void;
}

const MOCK_TICKETS: Ticket[] = [
  {
    id: 1,
    location: 200,
    store: 11,
    reported: "2026-02-25T13:05:00",
    issueType: "Login issue",
    createdBy: "John Doe",
    description:
      "Critical: Image skipping renders monitoring impossible. The issue started around 10:35 AM and lasted until 11:23 AM. Immediate action is required to restore full functionality.",
    status: "Open Ticket",
  },
  {
    id: 2,
    location: 201,
    store: 12,
    reported: "2026-05-12T08:30:00",
    issueType: "Payment error",
    createdBy: "Jane Smith",
    status: "Open Ticket",
    description:
      "Critical: Image skipping renders monitoring impossible. The issue started around 10:35 AM and lasted until 11:23 AM. Immediate action is required to restore full functionality.",
  },
  {
    id: 3,
    location: 202,
    store: 13,
    reported: "2026-05-14T15:20:00",
    issueType: "Missing invoice",
    createdBy: "Carlos Ruiz",
    status: "Open Ticket",
    description:
      "Critical: Image skipping renders monitoring impossible. The issue started around 10:35 AM and lasted until 11:23 AM. Immediate action is required to restore full functionality.",
  },
  {
    id: 4,
    location: 203,
    store: 14,
    reported: "2026-05-15T09:45:00",
    issueType: "Access denied",
    createdBy: "Maria Lopez",
    status: "Open Ticket",
    description:
      "Critical: Image skipping renders monitoring impossible. The issue started around 10:35 AM and lasted until 11:23 AM. Immediate action is required to restore full functionality.",
  },
  {
    id: 5,
    location: 204,
    store: 15,
    reported: "2026-05-20T11:00:00",
    issueType: "Data not loading",
    createdBy: "Peter Nguyen",
    status: "Open Ticket",
    description:
      "Critical: Image skipping renders monitoring impossible. The issue started around 10:35 AM and lasted until 11:23 AM. Immediate action is required to restore full functionality.",
  },
];

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
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              width: "661px",
              bgcolor: Colors.white,
              padding: "16px",
            },
          },
        }}
      >
        <Box height={"91%"}>
          <Box
            position={"absolute"}
            top={20}
            right={20}
            onClick={onClose}
            sx={{ cursor: "pointer" }}
          >
            <img src="./assets/x-close.svg" alt="" />
          </Box>
          <Title marginBottom="0" title="Tickets" />

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

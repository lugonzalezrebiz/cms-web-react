import type { Ticket } from "./types";

export const cards = [
  { title: "Unassigned", current: 9 },
  { title: "Paused Assignments", current: 1 },
  { title: "Rejected Assignments", current: 1 },
  { title: "Tickets", current: 1 },
  { title: "unassigned", current: 9 },
];


export const MOCK_TICKETS: Ticket[] = [
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

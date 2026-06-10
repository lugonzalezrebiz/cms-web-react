export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  roleID: number;
  active: boolean;
  createDate: string;
  modifyDate: string;
}

export interface UsersResponse {
  success: boolean;
  users: User[];
}

export interface Ticket {
  id: number;
  companyID: number;
  locationID: number;
  monitoringID: string;
  monitoringStatus: number;
  issueTypeID: number;
  issueTypeCode: string;
  issueTypeName: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  assignedTo: number | null;
  assignedToName: string | null;
  firstResponseDate: string | null;
  resolvedDate: string | null;
  closedDate: string | null;
  slaDueDate: string | null;
  slaBreached: boolean;
  rca: string | null;
  createdBy: number;
  createdByName: string;
  modifyUser: number | null;
  createDate: string;
  modifyDate: string | null;
}

export interface TicketsResponse {
  success: boolean;
  tickets: Ticket[];
}

export interface AssignmentCountItem {
  type: string;
  count: number;
}

export interface AssignmentCountResponse {
  success: boolean;
  scope: string;
  user: null;
  data: AssignmentCountItem[];
}
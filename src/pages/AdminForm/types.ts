import type { stateAssignments } from "../../components/stateColors";

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
  location: number;
  store: number;
  reported: string;
  issueType: string;
  createdBy: string;
  description: string;
  status: stateAssignments;
}
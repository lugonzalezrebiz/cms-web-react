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

export enum Role {
  Admin = 'admin',
  Ghost = 'ghost',
}

export interface LoggedInUser {
  jwt: string;
  account: Account;
}

/** From 'account' table */
export interface Account {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  firstName: string;
  lastName: string;
  email: string;
  roles: Role[];
  avatar?: string;
  isConfirmed: boolean;
}

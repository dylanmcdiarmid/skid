export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "Active" | "Inactive";
  organizations: Array<{ id: string; name: string }>;
  orgType: string;
  roles: string[];
  lastLogin: string; // ISO date string
};

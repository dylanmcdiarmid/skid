import { UsersTable } from "@/components/users-table";
import { mockUsers } from "@/data/mock-users";

export default function Users() {
  return (
    <div className="flex h-full min-h-0 flex-col space-y-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          Manage and view all users in the system.
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <UsersTable data={mockUsers} />
      </div>
    </div>
  );
}

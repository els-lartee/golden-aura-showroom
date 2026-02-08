import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminUser } from "@/lib/admin";

export interface UsersTabProps {
  users: AdminUser[];
  onToggleUser: (id: number, isActive: boolean) => void;
}

const UsersTab = ({ users, onToggleUser }: UsersTabProps) => {
  return (
    <div className="bg-secondary border border-border rounded-sm p-6">
      <h2 className="font-serif text-xl mb-4">Users</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onToggleUser(user.id, user.is_active)}
                >
                  {user.is_active ? "Deactivate" : "Activate"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UsersTab;

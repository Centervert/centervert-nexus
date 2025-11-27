import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Opportunity {
  id: string;
  name: string;
  type: string;
  status: string;
  priority: string | null;
  due_date: string | null;
  requestor_contact_id: string | null;
  requestor_organization_id: string | null;
  contacts?: { first_name: string; last_name: string } | null;
  organizations?: { name: string } | null;
  profiles?: { full_name: string; email: string } | null;
}

interface OpportunitiesTableProps {
  opportunities: Opportunity[];
}

const statusColors: Record<string, string> = {
  lead: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  qualified: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  proposal: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  negotiation: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  awarded: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  lost: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export function OpportunitiesTable({ opportunities }: OpportunitiesTableProps) {
  const navigate = useNavigate();

  const handleRowClick = (id: string) => {
    navigate(`/opportunities/${id}`);
  };

  if (opportunities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No opportunities found. Create your first opportunity to get started.
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Requestor</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Owner</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {opportunities.map((opportunity) => (
            <TableRow
              key={opportunity.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleRowClick(opportunity.id)}
            >
              <TableCell className="font-medium">{opportunity.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {opportunity.type}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={statusColors[opportunity.status] || ""}>
                  {opportunity.status}
                </Badge>
              </TableCell>
              <TableCell>
                {opportunity.priority && (
                  <Badge className={priorityColors[opportunity.priority] || ""}>
                    {opportunity.priority}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {opportunity.contacts && (
                  <span>
                    {opportunity.contacts.first_name} {opportunity.contacts.last_name}
                  </span>
                )}
                {opportunity.organizations && <span>{opportunity.organizations.name}</span>}
                {!opportunity.contacts && !opportunity.organizations && (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {opportunity.due_date ? format(new Date(opportunity.due_date), "MMM d, yyyy") : "—"}
              </TableCell>
              <TableCell>
                {opportunity.profiles?.full_name || opportunity.profiles?.email || "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

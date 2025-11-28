import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
            <TableHead>Manager</TableHead>
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
                <span className="capitalize text-sm text-muted-foreground">
                  {opportunity.type}
                </span>
              </TableCell>
              <TableCell>
                <span className="capitalize text-sm">
                  {opportunity.status.replace(/_/g, " ")}
                </span>
              </TableCell>
              <TableCell>
                {opportunity.priority ? (
                  <span className="capitalize text-sm text-muted-foreground">
                    {opportunity.priority}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {opportunity.organizations && opportunity.contacts ? (
                  <div className="space-y-0.5">
                    <div className="font-medium">{opportunity.organizations.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {opportunity.contacts.first_name} {opportunity.contacts.last_name}
                    </div>
                  </div>
                ) : opportunity.organizations ? (
                  <span>{opportunity.organizations.name}</span>
                ) : opportunity.contacts ? (
                  <span>
                    {opportunity.contacts.first_name} {opportunity.contacts.last_name}
                  </span>
                ) : (
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

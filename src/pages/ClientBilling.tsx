import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Download, Eye, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data - replace with actual data from your backend
const mockInvoices = [
  {
    id: "INV-0003",
    status: "open",
    dueDate: "2025-12-15",
    description: "Monthly Development Services - December 2025",
    amount: 2500.00,
    issueDate: "2025-11-24",
  },
  {
    id: "INV-0002",
    status: "paid",
    dueDate: "2025-11-15",
    description: "Monthly Development Services - November 2025",
    amount: 2500.00,
    issueDate: "2025-10-24",
    paidDate: "2025-11-10",
  },
  {
    id: "INV-0001",
    status: "paid",
    dueDate: "2025-10-15",
    description: "Monthly Development Services - October 2025",
    amount: 2500.00,
    issueDate: "2025-09-24",
    paidDate: "2025-10-12",
  },
];

const ClientBilling = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Calculate summary statistics
  const openInvoices = mockInvoices.filter(inv => inv.status === "open");
  const overdueInvoices = mockInvoices.filter(inv => {
    if (inv.status !== "open") return false;
    return new Date(inv.dueDate) < new Date();
  });
  const paidInvoices = mockInvoices.filter(inv => inv.status === "paid");

  const openAmount = openInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  // Filter invoices based on search
  const filteredInvoices = mockInvoices.filter(invoice =>
    invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
      case "open":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Open</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">Billing</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Open
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(openAmount)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {openInvoices.length} {openInvoices.length === 1 ? 'invoice' : 'invoices'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(overdueAmount)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overdueInvoices.length === 0 ? 'No invoices' : `${overdueInvoices.length} ${overdueInvoices.length === 1 ? 'invoice' : 'invoices'}`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Paid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(paidAmount)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {paidInvoices.length} {paidInvoices.length === 1 ? 'invoice' : 'invoices'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Payment Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">Excellent</div>
              <p className="text-xs text-muted-foreground mt-1">
                Consistently pay on time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Invoice Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{formatDate(invoice.dueDate)}</span>
                          {invoice.status === "open" && new Date(invoice.dueDate) > new Date() && (
                            <span className="text-xs text-muted-foreground">
                              in {Math.ceil((new Date(invoice.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {invoice.description}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                            {invoice.status === "open" && (
                              <DropdownMenuItem className="text-primary">
                                Pay Now
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientBilling;

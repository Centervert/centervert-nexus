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
import { Search, Download, Eye, MoreVertical, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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
    project: "Website Redesign",
    description: "Monthly Development Services - December 2025",
    amount: 2500.00,
    issueDate: "2025-11-24",
  },
  {
    id: "INV-0002",
    status: "paid",
    dueDate: "2025-11-15",
    project: "Mobile App Development",
    description: "Monthly Development Services - November 2025",
    amount: 2500.00,
    issueDate: "2025-10-24",
    paidDate: "2025-11-10",
  },
  {
    id: "INV-0001",
    status: "paid",
    dueDate: "2025-10-15",
    project: "E-commerce Platform",
    description: "Monthly Development Services - October 2025",
    amount: 2500.00,
    issueDate: "2025-09-24",
    paidDate: "2025-10-12",
  },
];

const ClientBilling = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<"status" | "dueDate" | null>("dueDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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
  let filteredInvoices = mockInvoices.filter(invoice =>
    invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort invoices
  if (sortColumn) {
    filteredInvoices = [...filteredInvoices].sort((a, b) => {
      if (sortColumn === "status") {
        const statusOrder = { paid: 0, open: 1, overdue: 2 };
        const aStatus = a.status as keyof typeof statusOrder;
        const bStatus = b.status as keyof typeof statusOrder;
        return sortDirection === "asc" 
          ? statusOrder[aStatus] - statusOrder[bStatus]
          : statusOrder[bStatus] - statusOrder[aStatus];
      } else if (sortColumn === "dueDate") {
        const aDate = new Date(a.dueDate).getTime();
        const bDate = new Date(b.dueDate).getTime();
        return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
      }
      return 0;
    });
  }

  const handleSort = (column: "status" | "dueDate") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: "status" | "dueDate") => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

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
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search or filter"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Invoice Table - Desktop */}
        <Card className="hidden md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead className="pl-6 border-r">Invoice No.</TableHead>
                  <TableHead className="px-6 border-r">
                    <button 
                      onClick={() => handleSort("status")}
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      Status
                      {getSortIcon("status")}
                    </button>
                  </TableHead>
                  <TableHead className="px-6 border-r">
                    <button 
                      onClick={() => handleSort("dueDate")}
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      Due Date
                      {getSortIcon("dueDate")}
                    </button>
                  </TableHead>
                  <TableHead className="px-6 border-r">Project</TableHead>
                  <TableHead className="px-6 text-right border-r">Amount</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
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
                    <TableRow key={invoice.id} className="border-b last:border-b-0">
                      <TableCell className="font-medium pl-6 border-r">{invoice.id}</TableCell>
                      <TableCell className="px-6 border-r">{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="px-6 border-r">
                        <div className="flex flex-col">
                          <span>{formatDate(invoice.dueDate)}</span>
                          {invoice.status === "open" && new Date(invoice.dueDate) > new Date() && (
                            <span className="text-xs text-muted-foreground">
                              in {Math.ceil((new Date(invoice.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 max-w-xs truncate border-r">
                        {invoice.project}
                      </TableCell>
                      <TableCell className="px-6 text-right font-medium border-r">
                        {formatCurrency(invoice.amount)}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
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

        {/* Invoice Cards - Mobile */}
        <div className="md:hidden space-y-4">
          {filteredInvoices.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No invoices found
              </CardContent>
            </Card>
          ) : (
            filteredInvoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-lg">{invoice.id}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {formatDate(invoice.dueDate)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(invoice.status)}
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
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-2">
                    {invoice.project}
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="text-lg font-semibold">
                      {formatCurrency(invoice.amount)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientBilling;

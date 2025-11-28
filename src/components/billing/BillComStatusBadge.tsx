import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BillComStatusBadgeProps {
  billcomCustomerId: string | null;
  billingEmail: string | null;
}

const BillComStatusBadge = ({ billcomCustomerId, billingEmail }: BillComStatusBadgeProps) => {
  if (billcomCustomerId) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Linked
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Linked to Bill.com customer</p>
            <p className="text-xs text-muted-foreground">ID: {billcomCustomerId.substring(0, 8)}...</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (billingEmail) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              Email Only
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Can auto-link by billing email</p>
            <p className="text-xs text-muted-foreground">{billingEmail}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
            <XCircle className="h-3 w-3 mr-1" />
            Not Linked
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>No billing email or Bill.com link</p>
          <p className="text-xs text-muted-foreground">Add billing email to enable linking</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default BillComStatusBadge;

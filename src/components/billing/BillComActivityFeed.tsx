import { useBillComLogs } from "@/hooks/useBillComLogs";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Link2, RefreshCw, XCircle, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BillComActivityFeedProps {
  organizationId: string;
}

const BillComActivityFeed = ({ organizationId }: BillComActivityFeedProps) => {
  const { data: logs, isLoading } = useBillComLogs(organizationId);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'customer_linked':
      case 'customer_auto_linked':
        return <Link2 className="h-4 w-4 text-blue-600" />;
      case 'sync_completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'sync_failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No Bill.com activity yet</p>
        <p className="text-sm mt-1">Sync events will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div key={log.id} className="flex gap-3 pb-4 border-b last:border-0">
          <div className="flex-shrink-0 mt-1">
            {getActivityIcon(log.activity_type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{log.message}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
              {log.profiles?.full_name && (
                <span> by {log.profiles.full_name}</span>
              )}
            </p>
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                {log.metadata.invoice_count && (
                  <div>Invoices: {log.metadata.invoice_count}</div>
                )}
                {log.metadata.customer_name && (
                  <div>Customer: {log.metadata.customer_name}</div>
                )}
                {log.metadata.error && (
                  <div className="text-red-600">Error: {log.metadata.error}</div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BillComActivityFeed;

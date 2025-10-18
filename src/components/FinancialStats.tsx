import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Clock, CheckCircle, XCircle, CreditCard, TrendingUp } from 'lucide-react';
import { useQuoteStats } from '@/hooks/useQuoteStats';
import { cn } from '@/lib/utils';

export const FinancialStats = () => {
  const { data: stats, isLoading } = useQuoteStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statCards = [
    {
      icon: Clock,
      label: 'Awaiting Approval',
      value: stats?.awaitingApproval.count || 0,
      subValue: formatCurrency(stats?.awaitingApproval.value || 0),
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      icon: CheckCircle,
      label: 'Approved Quotes',
      value: stats?.approved.count || 0,
      subValue: `${stats?.approved.withPO || 0}/${stats?.approved.count || 0} with PO (${stats?.approved.percentWithPO.toFixed(0)}%)`,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: XCircle,
      label: 'Declined Quotes',
      value: stats?.declined.count || 0,
      subValue: formatCurrency(stats?.declined.value || 0),
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      icon: CreditCard,
      label: 'Paid',
      value: stats?.paid.count || 0,
      subValue: formatCurrency(stats?.paid.value || 0),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: DollarSign,
      label: 'Total Approved Value',
      value: formatCurrency(stats?.approved.value || 0),
      subValue: 'Pending payment',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: TrendingUp,
      label: 'Total Revenue',
      value: formatCurrency(stats?.paid.value || 0),
      subValue: 'Successfully collected',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ];

  if (isLoading) {
    return (
      <div className="mb-6 md:mb-8">
        <h3 className="text-lg font-semibold mb-4">Financial Overview</h3>
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-5" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 md:mb-8">
      <h3 className="text-lg font-semibold mb-4">Financial Overview</h3>
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.label} className="overflow-hidden">
            <CardHeader className={cn('flex flex-row items-center justify-between space-y-0 pb-2', stat.bgColor)}>
              <stat.icon className={cn('h-5 w-5', stat.color)} />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">{stat.subValue}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

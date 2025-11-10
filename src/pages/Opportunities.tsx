import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Plus, TrendingUp, DollarSign, Target, Clock } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOpportunities, useOpportunityStats } from '@/hooks/useOpportunities';
import CreateOpportunityDialog from '@/components/opportunities/CreateOpportunityDialog';
import { format } from 'date-fns';

const Opportunities = () => {
  const navigate = useNavigate();
  const { data: opportunities, isLoading } = useOpportunities();
  const { data: stats } = useOpportunityStats();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const filteredOpportunities = opportunities?.filter(opp => {
    const matchesSearch = 
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.issuing_organization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.rfp_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || opp.status === statusFilter;
    const matchesType = typeFilter === 'all' || opp.opportunity_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const formatStatusText = (status: string) => {
    return status
      .split('_')
      .map(word => {
        // Keep RFP in all caps
        if (word.toLowerCase() === 'rfp') return 'RFP';
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  };

  const formatPriorityText = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'lead': return 'bg-gray-500';
      case 'working_on_rfp': return 'bg-yellow-500';
      case 'submitted': return 'bg-orange-500';
      case 'awarded': return 'bg-green-500';
      case 'lost': return 'bg-red-500';
      case 'on_hold': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getDeadlineDisplay = (opp: any) => {
    // If proposal submitted, check if they made the deadline
    if (opp.status === 'submitted' && opp.submitted_at) {
      if (opp.submission_deadline) {
        const submitted = new Date(opp.submitted_at);
        const deadline = new Date(opp.submission_deadline);
        
        if (submitted <= deadline) {
          return { text: 'Submitted', color: 'text-green-600 font-semibold' };
        } else {
          return { 
            text: format(new Date(opp.submitted_at), 'MMM d, yyyy h:mm a'), 
            color: 'text-red-500' 
          };
        }
      }
      // If no deadline but submitted, show submitted date
      return { 
        text: format(new Date(opp.submitted_at), 'MMM d, yyyy h:mm a'), 
        color: 'text-muted-foreground' 
      };
    }
    
    // Otherwise show deadline urgency
    if (!opp.submission_deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(opp.submission_deadline);
    const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return { color: 'text-red-500 font-bold', text: 'Overdue' };
    if (daysUntil <= 7) return { color: 'text-orange-500 font-semibold', text: format(deadlineDate, 'MMM d, h:mm a') };
    if (daysUntil <= 30) return { color: 'text-yellow-600', text: format(deadlineDate, 'MMM d, h:mm a') };
    return { color: 'text-muted-foreground', text: format(deadlineDate, 'MMM d, h:mm a') };
  };

  const getDeadlineHeader = (hasSubmittedOpportunities: boolean) => {
    return hasSubmittedOpportunities ? 'Submitted/Deadline' : 'Deadline';
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-4">
              <SidebarTrigger />
            </div>
          </div>
          <div className="mobile-container space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="mobile-title font-bold flex items-center gap-2">
              <Briefcase className="h-6 w-6 sm:h-8 sm:w-8" />
              Sales & Opportunities
            </h1>
            <p className="text-sm text-muted-foreground">Track government and private sector sales opportunities</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="touch-target w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Create Opportunity
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground truncate">Total Opportunities</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg flex-shrink-0">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground truncate">Pipeline Value</p>
                <p className="text-2xl font-bold truncate">${(stats?.pipelineValue || 0).toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground truncate">Active Leads</p>
                <p className="text-2xl font-bold">{stats?.activeLeads || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg flex-shrink-0">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground truncate">Upcoming Deadlines</p>
                <p className="text-2xl font-bold">{stats?.upcomingDeadlines || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="mobile-card-padding">
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              <Input
                placeholder="Search opportunities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="touch-target w-full"
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="touch-target w-full sm:w-[200px]">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="working_on_rfp">Working on RFP</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="awarded">Awarded</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="touch-target w-full sm:w-[200px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="private">Private Sector</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Desktop Table View - Hidden on Mobile */}
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>{getDeadlineHeader(filteredOpportunities?.some(o => o.status === 'submitted') || false)}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading opportunities...
                      </TableCell>
                    </TableRow>
                  ) : filteredOpportunities?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No opportunities found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOpportunities?.map((opp) => {
                      const deadlineInfo = getDeadlineDisplay(opp);
                      return (
                        <TableRow
                          key={opp.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/opportunities/${opp.id}`)}
                        >
                          <TableCell className="font-medium">{opp.title}</TableCell>
                          <TableCell>
                            <Badge className={opp.opportunity_type === 'government' ? 'bg-blue-500' : 'bg-green-500'}>
                              {opp.opportunity_type === 'government' ? 'Government' : 'Private'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(opp.status)}>
                              {formatStatusText(opp.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityBadgeColor(opp.priority)}>
                              {formatPriorityText(opp.priority)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {opp.estimated_value ? `$${opp.estimated_value.toLocaleString()}` : '-'}
                          </TableCell>
                          <TableCell>{opp.assigned_user?.full_name || 'Unassigned'}</TableCell>
                          <TableCell>
                            {deadlineInfo ? (
                              <span className={deadlineInfo.color}>{deadlineInfo.text}</span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View - Shown on Mobile */}
            <div className="lg:hidden space-y-3">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading opportunities...
                </div>
              ) : filteredOpportunities?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No opportunities found
                </div>
              ) : (
                filteredOpportunities?.map((opp) => {
                  const deadlineInfo = getDeadlineDisplay(opp);
                  return (
                    <Card
                      key={opp.id}
                      className="p-4 cursor-pointer hover:bg-muted/50 space-y-3"
                      onClick={() => navigate(`/opportunities/${opp.id}`)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium line-clamp-2">{opp.title}</h3>
                        </div>
                        <Badge className={opp.opportunity_type === 'government' ? 'bg-blue-500' : 'bg-green-500'}>
                          {opp.opportunity_type === 'government' ? 'Gov' : 'Private'}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getStatusBadgeColor(opp.status)} variant="secondary">
                          {formatStatusText(opp.status)}
                        </Badge>
                        <Badge className={getPriorityBadgeColor(opp.priority)}>
                          {formatPriorityText(opp.priority)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Value</p>
                          <p className="font-medium">
                            {opp.estimated_value ? `$${opp.estimated_value.toLocaleString()}` : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {opp.status === 'submitted' ? 'Submitted' : 'Deadline'}
                          </p>
                          <p className={`font-medium ${deadlineInfo?.color || ''}`}>
                            {deadlineInfo?.text || '-'}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">Assigned To</p>
                          <p className="font-medium">{opp.assigned_user?.full_name || 'Unassigned'}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </Card>
          </div>

          <CreateOpportunityDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Opportunities;

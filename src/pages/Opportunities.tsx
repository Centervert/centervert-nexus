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
import { formatDistanceToNow } from 'date-fns';

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
      opp.opportunity_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.issuing_organization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.rfp_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || opp.status === statusFilter;
    const matchesType = typeFilter === 'all' || opp.opportunity_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'lead': return 'bg-gray-500';
      case 'qualified': return 'bg-yellow-500';
      case 'proposal_submitted': return 'bg-orange-500';
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

  const getDeadlineUrgency = (deadline: string | null) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return { color: 'text-red-500 font-bold', text: 'Overdue' };
    if (daysUntil <= 7) return { color: 'text-orange-500 font-semibold', text: `${daysUntil}d` };
    if (daysUntil <= 30) return { color: 'text-yellow-600', text: `${daysUntil}d` };
    return { color: 'text-muted-foreground', text: `${daysUntil}d` };
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
          <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Briefcase className="h-8 w-8" />
              Sales & Opportunities
            </h1>
            <p className="text-muted-foreground">Track government and private sector sales opportunities</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Opportunity
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Opportunities</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
                <p className="text-2xl font-bold">${(stats?.pipelineValue || 0).toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Leads</p>
                <p className="text-2xl font-bold">{stats?.activeLeads || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Upcoming Deadlines</p>
                <p className="text-2xl font-bold">{stats?.upcomingDeadlines || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Search opportunities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="proposal_submitted">Proposal Submitted</SelectItem>
                  <SelectItem value="awarded">Awarded</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="private">Private Sector</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opportunity #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Deadline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading opportunities...
                    </TableCell>
                  </TableRow>
                ) : filteredOpportunities?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No opportunities found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOpportunities?.map((opp) => {
                    const deadlineInfo = getDeadlineUrgency(opp.submission_deadline);
                    return (
                      <TableRow
                        key={opp.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/opportunities/${opp.id}`)}
                      >
                        <TableCell className="font-mono text-sm">{opp.opportunity_number}</TableCell>
                        <TableCell className="font-medium">{opp.title}</TableCell>
                        <TableCell>
                          <Badge className={opp.opportunity_type === 'government' ? 'bg-blue-500' : 'bg-green-500'}>
                            {opp.opportunity_type === 'government' ? 'Government' : 'Private'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(opp.status)}>
                            {opp.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityBadgeColor(opp.priority)}>
                            {opp.priority}
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
        </Card>
          </div>

          <CreateOpportunityDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Opportunities;

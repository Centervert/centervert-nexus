import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Building2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOpportunity, useUpdateOpportunity, useDeleteOpportunity } from '@/hooks/useOpportunities';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import OpportunityMessages from '@/components/opportunities/OpportunityMessages';
import OpportunityAttachments from '@/components/opportunities/OpportunityAttachments';
import OpportunityContacts from '@/components/opportunities/OpportunityContacts';
import EditOpportunityDialog from '@/components/opportunities/EditOpportunityDialog';
import { OpportunityQuotePlayground } from '@/components/opportunities/OpportunityQuotePlayground';
import { useOpportunityUnreadCount } from '@/hooks/useUnreadMessages';

const OpportunityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: opportunity, isLoading } = useOpportunity(id!);
  const updateOpportunity = useUpdateOpportunity();
  const deleteOpportunity = useDeleteOpportunity();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { data: unreadCount = 0 } = useOpportunityUnreadCount(id!);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!opportunity) {
    return <div className="flex items-center justify-center min-h-screen">Opportunity not found</div>;
  }

  const handleStatusChange = (status: string) => {
    updateOpportunity.mutate({
      id: opportunity.id,
      updates: { status: status as any },
    });
  };

  const handleDelete = () => {
    deleteOpportunity.mutate(opportunity.id, {
      onSuccess: () => {
        navigate('/opportunities');
      },
    });
  };

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
        {/* Header */}
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => navigate('/opportunities')} className="touch-target">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Opportunities
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="mobile-title font-bold">{opportunity.title}</h1>
                <Badge className={opportunity.opportunity_type === 'government' ? 'bg-blue-500' : 'bg-green-500'}>
                  {opportunity.opportunity_type === 'government' ? 'Government' : 'Private'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-mono">{opportunity.opportunity_number}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Select value={opportunity.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="touch-target w-full sm:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="proposal_submitted">Proposal Submitted</SelectItem>
                  <SelectItem value="awarded">Awarded</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setEditDialogOpen(true)} className="touch-target flex-1 sm:flex-none">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setDeleteDialogOpen(true)} className="touch-target flex-1 sm:flex-none">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Info Bar */}
        <Card className="mobile-card-padding">
          <div className="grid grid-cols-2 lg:flex lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge className={getStatusBadgeColor(opportunity.status)}>
                {opportunity.status.replace('_', ' ')}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Priority</p>
              <Badge className={getPriorityBadgeColor(opportunity.priority)}>
                {opportunity.priority}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Estimated Value</p>
              <p className="font-semibold text-sm">
                {opportunity.estimated_value ? `$${opportunity.estimated_value.toLocaleString()}` : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Assigned To</p>
              <p className="font-semibold text-sm truncate">{opportunity.assigned_user?.full_name || 'Unassigned'}</p>
            </div>
            {opportunity.submission_deadline && (
              <div>
                <p className="text-xs text-muted-foreground">Deadline</p>
                <p className="font-semibold text-sm">{format(new Date(opportunity.submission_deadline), 'MMM d, yyyy')}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
            <TabsTrigger value="overview" className="touch-target">Overview</TabsTrigger>
            <TabsTrigger value="quote" className="touch-target whitespace-nowrap">Quote</TabsTrigger>
            <TabsTrigger value="contacts" className="touch-target">Contacts</TabsTrigger>
            <TabsTrigger value="communication" className="touch-target relative whitespace-nowrap">
              Comm
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 min-w-4 px-1 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="documents" className="touch-target">Docs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="mobile-card-padding space-y-6">
              {/* Description */}
              {opportunity.description && (
                <div>
                  <h3 className="font-semibold text-base lg:text-lg mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{opportunity.description}</p>
                </div>
              )}

              {/* Important Dates */}
              <div>
                <h3 className="font-semibold text-base lg:text-lg mb-4">Important Dates</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {opportunity.issue_date && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Issue Date</p>
                      <p className="font-medium">{format(new Date(opportunity.issue_date), 'MMM d, yyyy')}</p>
                    </div>
                  )}
                  {opportunity.submission_deadline && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Submission Deadline</p>
                      <p className="font-medium">{format(new Date(opportunity.submission_deadline), 'MMM d, yyyy h:mm a')}</p>
                    </div>
                  )}
                  {opportunity.award_date && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Award Date</p>
                      <p className="font-medium">{format(new Date(opportunity.award_date), 'MMM d, yyyy')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Government-Specific Fields */}
              {opportunity.opportunity_type === 'government' && (
                <>
                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-base lg:text-lg mb-4 text-blue-600">Government Details</h3>
                    
                    <div className="space-y-6">
                      {/* Procurement Info */}
                      <div>
                        <h4 className="font-medium text-sm lg:text-base mb-3">Procurement Information</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {opportunity.rfp_number && (
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">RFP Number</p>
                              <p className="font-medium">{opportunity.rfp_number}</p>
                            </div>
                          )}
                          {opportunity.issuing_organization && (
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Issuing Organization</p>
                              <p className="font-medium">{opportunity.issuing_organization}</p>
                            </div>
                          )}
                        </div>

                        {(opportunity.procurement_officer_name || opportunity.procurement_officer_email || opportunity.procurement_officer_phone) && (
                          <div className="mt-4">
                            <p className="text-sm text-muted-foreground mb-2">Procurement Officer</p>
                            <div className="space-y-1">
                              {opportunity.procurement_officer_name && <p className="font-medium">{opportunity.procurement_officer_name}</p>}
                              {opportunity.procurement_officer_email && <p className="text-sm">{opportunity.procurement_officer_email}</p>}
                              {opportunity.procurement_officer_phone && <p className="text-sm">{opportunity.procurement_officer_phone}</p>}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Submission Details */}
                      {(opportunity.submission_url || opportunity.submission_address) && (
                        <div>
                          <h4 className="font-medium mb-3">Submission Details</h4>
                          <div className="space-y-2">
                            {opportunity.submission_url && (
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Submission URL</p>
                                <a href={opportunity.submission_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                  {opportunity.submission_url}
                                </a>
                              </div>
                            )}
                            {opportunity.submission_address && (
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Submission Address</p>
                                <p className="font-medium whitespace-pre-wrap">{opportunity.submission_address}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Conference Details */}
                      {opportunity.conference_date && (
                        <div>
                          <h4 className="font-medium mb-3">Conference Details</h4>
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Date & Time</p>
                              <p className="font-medium">{format(new Date(opportunity.conference_date), 'MMM d, yyyy h:mm a')}</p>
                            </div>
                            {opportunity.conference_type && (
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Type</p>
                                <p className="font-medium capitalize">{opportunity.conference_type.replace('_', ' ')}</p>
                              </div>
                            )}
                            {opportunity.conference_location && (
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Location</p>
                                <p className="font-medium">{opportunity.conference_location}</p>
                              </div>
                            )}
                            {opportunity.conference_link && (
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Link</p>
                                <a href={opportunity.conference_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                  {opportunity.conference_link}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              {opportunity.notes && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-lg mb-2">Notes</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{opportunity.notes}</p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="quote">
            <OpportunityQuotePlayground opportunityId={id!} />
          </TabsContent>

          <TabsContent value="contacts">
            <OpportunityContacts opportunityId={id!} />
          </TabsContent>

          <TabsContent value="communication">
            <OpportunityMessages opportunityId={id!} />
          </TabsContent>

          <TabsContent value="documents">
            <OpportunityAttachments opportunityId={id!} />
          </TabsContent>
        </Tabs>
          </div>

          <EditOpportunityDialog 
            open={editDialogOpen} 
            onOpenChange={setEditDialogOpen}
            opportunity={opportunity}
          />

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Opportunity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this opportunity? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default OpportunityDetail;

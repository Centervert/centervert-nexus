import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateOpportunity } from '@/hooks/useOpportunities';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface CreateOpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateOpportunityDialog = ({ open, onOpenChange }: CreateOpportunityDialogProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { register, handleSubmit, watch, setValue, reset } = useForm();
  const createOpportunity = useCreateOpportunity();
  const [conferenceOpen, setConferenceOpen] = useState(false);

  const opportunityType = watch('opportunity_type', 'private');

  const { data: adminUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_available_agents');
      if (error) throw error;
      return data;
    },
  });

  const onSubmit = async (data: any) => {
    const opportunityData = {
      ...data,
      created_by: user?.id,
      assigned_to: data.assigned_to || null,
      estimated_value: data.estimated_value ? parseFloat(data.estimated_value) : null,
      // Convert empty date strings to null
      issue_date: data.issue_date || null,
      questions_deadline: data.questions_deadline || null,
      submission_deadline: data.submission_deadline || null,
      award_date: data.award_date || null,
      conference_date: data.conference_date || null,
    };

    // Clear government fields if type is private
    if (data.opportunity_type === 'private') {
      delete opportunityData.issuing_organization;
      delete opportunityData.rfp_number;
      delete opportunityData.procurement_officer_name;
      delete opportunityData.procurement_officer_email;
      delete opportunityData.procurement_officer_phone;
      delete opportunityData.submission_url;
      delete opportunityData.submission_address;
      delete opportunityData.conference_date;
      delete opportunityData.conference_type;
      delete opportunityData.conference_location;
      delete opportunityData.conference_link;
    }

    createOpportunity.mutate(opportunityData, {
      onSuccess: (newOpportunity) => {
        reset();
        onOpenChange(false);
        navigate(`/opportunities/${newOpportunity.id}`);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Opportunity</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" {...register('title', { required: true })} />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} rows={3} />
            </div>

            <div>
              <Label>Opportunity Type *</Label>
              <RadioGroup
                defaultValue="private"
                onValueChange={(value) => setValue('opportunity_type', value)}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private" className="font-normal cursor-pointer">
                    Private Sector
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="government" id="government" />
                  <Label htmlFor="government" className="font-normal cursor-pointer">
                    Government/Public Sector
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority *</Label>
                <Select defaultValue="medium" onValueChange={(value) => setValue('priority', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="estimated_value">Estimated Value ($)</Label>
                <Input
                  id="estimated_value"
                  type="number"
                  step="0.01"
                  {...register('estimated_value')}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="assigned_to">Assigned To</Label>
              <Select onValueChange={(value) => setValue('assigned_to', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {adminUsers?.map((admin: any) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.full_name || admin.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select defaultValue="lead" onValueChange={(value) => setValue('status', value)}>
                <SelectTrigger>
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
            </div>
          </div>

          {/* Dates Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Important Dates</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="issue_date">Issue Date</Label>
                <Input id="issue_date" type="date" {...register('issue_date')} />
              </div>
              <div>
                <Label htmlFor="submission_deadline">Submission Deadline</Label>
                <Input
                  id="submission_deadline"
                  type="datetime-local"
                  {...register('submission_deadline')}
                />
              </div>
              <div>
                <Label htmlFor="award_date">Award Date</Label>
                <Input id="award_date" type="date" {...register('award_date')} />
              </div>
            </div>
          </div>

          {/* Government-Only Fields */}
          {opportunityType === 'government' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-lg text-blue-600">Government/Public Sector Details</h3>
              
              {/* Procurement Section */}
              <div className="space-y-4">
                <h4 className="font-medium">Procurement Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rfp_number">RFP Number</Label>
                    <Input id="rfp_number" {...register('rfp_number')} />
                  </div>
                  <div>
                    <Label htmlFor="issuing_organization">Issuing Organization</Label>
                    <Input id="issuing_organization" {...register('issuing_organization')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Procurement Officer</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <Input placeholder="Name" {...register('procurement_officer_name')} />
                    <Input
                      type="email"
                      placeholder="Email"
                      {...register('procurement_officer_email')}
                    />
                    <Input
                      type="tel"
                      placeholder="Phone"
                      {...register('procurement_officer_phone')}
                    />
                  </div>
                </div>
              </div>

              {/* Submission Section */}
              <div className="space-y-4">
                <h4 className="font-medium">Submission Details</h4>
                <div>
                  <Label htmlFor="submission_url">Submission URL</Label>
                  <Input id="submission_url" type="url" {...register('submission_url')} />
                </div>
                <div>
                  <Label htmlFor="submission_address">Submission Address</Label>
                  <Textarea id="submission_address" {...register('submission_address')} rows={2} />
                </div>
              </div>

              {/* Conference Section */}
              <Collapsible open={conferenceOpen} onOpenChange={setConferenceOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 font-medium hover:underline">
                  <ChevronDown className={`h-4 w-4 transition-transform ${conferenceOpen ? 'rotate-180' : ''}`} />
                  Pre-bid Conference Details (Optional)
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="conference_date">Conference Date & Time</Label>
                      <Input
                        id="conference_date"
                        type="datetime-local"
                        {...register('conference_date')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="conference_type">Conference Type</Label>
                      <Select onValueChange={(value) => setValue('conference_type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pre_bid">Pre-bid</SelectItem>
                          <SelectItem value="virtual">Virtual</SelectItem>
                          <SelectItem value="site_visit">Site Visit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="conference_location">Conference Location</Label>
                    <Input id="conference_location" {...register('conference_location')} />
                  </div>
                  <div>
                    <Label htmlFor="conference_link">Conference Link</Label>
                    <Input
                      id="conference_link"
                      type="url"
                      placeholder="https://..."
                      {...register('conference_link')}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register('notes')} rows={3} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createOpportunity.isPending}>
              {createOpportunity.isPending ? 'Creating...' : 'Create Opportunity'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOpportunityDialog;

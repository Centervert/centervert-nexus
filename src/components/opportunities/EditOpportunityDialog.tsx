import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateOpportunity } from '@/hooks/useOpportunities';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EditOpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity: any;
}

const EditOpportunityDialog = ({ open, onOpenChange, opportunity }: EditOpportunityDialogProps) => {
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      title: opportunity.title || '',
      description: opportunity.description || '',
      opportunity_type: opportunity.opportunity_type || 'private',
      priority: opportunity.priority || 'medium',
      estimated_value: opportunity.estimated_value || '',
      assigned_to: opportunity.assigned_to || '',
      issue_date: opportunity.issue_date || '',
      questions_deadline: opportunity.questions_deadline?.split('T')[0] || '',
      submission_deadline: opportunity.submission_deadline ? new Date(opportunity.submission_deadline).toISOString().slice(0, 16) : '',
      submitted_at: opportunity.submitted_at ? new Date(opportunity.submitted_at).toISOString().slice(0, 16) : '',
      award_date: opportunity.award_date || '',
      notes: opportunity.notes || '',
      rfp_number: opportunity.rfp_number || '',
      issuing_organization: opportunity.issuing_organization || '',
      procurement_officer_name: opportunity.procurement_officer_name || '',
      procurement_officer_email: opportunity.procurement_officer_email || '',
      procurement_officer_phone: opportunity.procurement_officer_phone || '',
      submission_url: opportunity.submission_url || '',
      submission_address: opportunity.submission_address || '',
      conference_date: opportunity.conference_date?.split('T')[0] || '',
      conference_location: opportunity.conference_location || '',
      conference_link: opportunity.conference_link || '',
    },
  });

  const opportunityType = watch('opportunity_type');
  const updateOpportunity = useUpdateOpportunity();

  const { data: agents = [] } = useQuery({
    queryKey: ['available-agents'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_available_agents');
      if (error) throw error;
      return data;
    },
  });

  const onSubmit = (data: any) => {
    const updates = {
      ...data,
      estimated_value: data.estimated_value ? parseFloat(data.estimated_value) : null,
      issue_date: data.issue_date || null,
      questions_deadline: data.questions_deadline || null,
      submission_deadline: data.submission_deadline || null,
      submitted_at: data.submitted_at || null,
      award_date: data.award_date || null,
      conference_date: data.conference_date || null,
    };

    // Clear government fields if type is private
    if (data.opportunity_type === 'private') {
      updates.rfp_number = null;
      updates.issuing_organization = null;
      updates.procurement_officer_name = null;
      updates.procurement_officer_email = null;
      updates.procurement_officer_phone = null;
      updates.submission_url = null;
      updates.submission_address = null;
      updates.conference_date = null;
      updates.conference_location = null;
      updates.conference_link = null;
    }

    updateOpportunity.mutate(
      { id: opportunity.id, updates },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Opportunity</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" {...register('title', { required: true })} />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" {...register('description', { required: true })} rows={3} />
            </div>

            <div>
              <Label htmlFor="opportunity_type">Type *</Label>
              <Select value={opportunityType} onValueChange={(value) => setValue('opportunity_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority *</Label>
              <Select defaultValue={opportunity.priority} onValueChange={(value) => setValue('priority', value)}>
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
              <Input id="estimated_value" type="number" step="0.01" {...register('estimated_value')} />
            </div>

            <div>
              <Label htmlFor="assigned_to">Assign To</Label>
              <Select defaultValue={opportunity.assigned_to || ''} onValueChange={(value) => setValue('assigned_to', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent: any) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Government-specific fields */}
          {opportunityType === 'government' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-blue-600">Government Opportunity Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rfp_number">RFP Number</Label>
                  <Input id="rfp_number" {...register('rfp_number')} />
                </div>
                <div>
                  <Label htmlFor="issuing_organization">Issuing Organization</Label>
                  <Input id="issuing_organization" {...register('issuing_organization')} />
                </div>
                <div>
                  <Label htmlFor="issue_date">Issue Date</Label>
                  <Input id="issue_date" type="date" {...register('issue_date')} />
                </div>
                <div>
                  <Label htmlFor="questions_deadline">Questions Deadline</Label>
                  <Input id="questions_deadline" type="date" {...register('questions_deadline')} />
                </div>
                <div>
                  <Label htmlFor="submission_deadline">Submission Deadline</Label>
                  <Input id="submission_deadline" type="datetime-local" {...register('submission_deadline')} />
                </div>
                <div>
                  <Label htmlFor="award_date">Award Date</Label>
                  <Input id="award_date" type="date" {...register('award_date')} />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-sm">Procurement Officer</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="procurement_officer_name">Name</Label>
                    <Input id="procurement_officer_name" {...register('procurement_officer_name')} />
                  </div>
                  <div>
                    <Label htmlFor="procurement_officer_email">Email</Label>
                    <Input id="procurement_officer_email" type="email" {...register('procurement_officer_email')} />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="procurement_officer_phone">Phone</Label>
                    <Input id="procurement_officer_phone" {...register('procurement_officer_phone')} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-sm">Submission Details</h4>
                <div>
                  <Label htmlFor="submission_url">Submission URL</Label>
                  <Input id="submission_url" type="url" {...register('submission_url')} />
                </div>
                <div>
                  <Label htmlFor="submission_address">Submission Address</Label>
                  <Textarea id="submission_address" {...register('submission_address')} rows={2} />
                </div>
                <div>
                  <Label htmlFor="submitted_at">Submitted Date</Label>
                  <Input id="submitted_at" type="datetime-local" {...register('submitted_at')} />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-sm">Conference Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="conference_date">Conference Date</Label>
                    <Input id="conference_date" type="date" {...register('conference_date')} />
                  </div>
                  <div>
                    <Label htmlFor="conference_location">Location</Label>
                    <Input id="conference_location" {...register('conference_location')} />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="conference_link">Conference Link</Label>
                    <Input id="conference_link" type="url" {...register('conference_link')} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register('notes')} rows={3} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateOpportunity.isPending}>
              {updateOpportunity.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditOpportunityDialog;

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Eye, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEmail?: string;
  initialRole?: 'admin' | 'agent';
}

export const EmailPreviewDialog = ({ 
  open, 
  onOpenChange,
  initialEmail = '',
  initialRole = 'agent'
}: EmailPreviewDialogProps) => {
  const [previewEmail, setPreviewEmail] = useState(initialEmail);
  const [previewRole, setPreviewRole] = useState<'admin' | 'agent'>(initialRole);
  const [shouldFetch, setShouldFetch] = useState(false);
  const { toast } = useToast();

  const { data: previewHtml, isLoading, refetch } = useQuery({
    queryKey: ['email-preview', previewEmail, previewRole],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase.functions.invoke('preview-invite-email', {
        body: { 
          email: previewEmail || 'preview@example.com',
          role: previewRole,
          inviter_name: profile?.full_name || user.email || 'A team member',
        },
      });

      if (error) throw error;
      return data as string;
    },
    enabled: shouldFetch && open,
  });

  const handlePreview = () => {
    if (!previewEmail) {
      toast({
        title: 'Email required',
        description: 'Please enter an email address to preview',
        variant: 'destructive',
      });
      return;
    }
    setShouldFetch(true);
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Email Preview
          </DialogTitle>
          <DialogDescription>
            Preview how the invitation email will look before sending
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preview-email">Recipient Email</Label>
              <Input
                id="preview-email"
                type="email"
                placeholder="user@example.com"
                value={previewEmail}
                onChange={(e) => setPreviewEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preview-role">Role</Label>
              <Select value={previewRole} onValueChange={(value: 'admin' | 'agent') => setPreviewRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="agent">Team Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handlePreview}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Eye className="mr-2 h-4 w-4" />
              Generate Preview
            </Button>
            {shouldFetch && (
              <Button 
                variant="outline"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            )}
          </div>

          {/* Preview Frame */}
          {shouldFetch && (
            <div className="border rounded-lg overflow-hidden flex-1 min-h-[500px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : previewHtml ? (
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-[500px]"
                  title="Email Preview"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="flex items-center justify-center h-full p-12">
                  <p className="text-muted-foreground">Click "Generate Preview" to see the email</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

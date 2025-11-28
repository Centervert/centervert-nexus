-- Create enum for update types
CREATE TYPE public.opportunity_update_type AS ENUM ('manual', 'status_change', 'assignment_change', 'resource_added');

-- Create opportunity_updates table
CREATE TABLE public.opportunity_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  update_type public.opportunity_update_type NOT NULL DEFAULT 'manual',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create opportunity_team_members table
CREATE TABLE public.opportunity_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE(opportunity_id, user_id)
);

-- Enable RLS
ALTER TABLE public.opportunity_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for opportunity_updates
CREATE POLICY "Admins and agents can manage updates"
  ON public.opportunity_updates
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Users can view updates for opportunities they can access"
  ON public.opportunity_updates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.opportunities o
      WHERE o.id = opportunity_updates.opportunity_id
      AND (
        has_role(auth.uid(), 'admin'::app_role) 
        OR has_role(auth.uid(), 'agent'::app_role)
        OR o.owner_id = auth.uid()
        OR o.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.opportunity_team_members otm
          WHERE otm.opportunity_id = o.id AND otm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Team members can create updates"
  ON public.opportunity_updates
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.opportunities o
      WHERE o.id = opportunity_updates.opportunity_id
      AND (
        has_role(auth.uid(), 'admin'::app_role) 
        OR has_role(auth.uid(), 'agent'::app_role)
        OR o.owner_id = auth.uid()
        OR o.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.opportunity_team_members otm
          WHERE otm.opportunity_id = o.id AND otm.user_id = auth.uid()
        )
      )
    )
  );

-- RLS Policies for opportunity_team_members
CREATE POLICY "Admins and agents can manage team members"
  ON public.opportunity_team_members
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Users can view team members for opportunities they can access"
  ON public.opportunity_team_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.opportunities o
      WHERE o.id = opportunity_team_members.opportunity_id
      AND (
        has_role(auth.uid(), 'admin'::app_role) 
        OR has_role(auth.uid(), 'agent'::app_role)
        OR o.owner_id = auth.uid()
        OR o.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.opportunity_team_members otm
          WHERE otm.opportunity_id = o.id AND otm.user_id = auth.uid()
        )
      )
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_opportunity_updates_opportunity_id ON public.opportunity_updates(opportunity_id);
CREATE INDEX idx_opportunity_updates_created_at ON public.opportunity_updates(created_at DESC);
CREATE INDEX idx_opportunity_team_members_opportunity_id ON public.opportunity_team_members(opportunity_id);
CREATE INDEX idx_opportunity_team_members_user_id ON public.opportunity_team_members(user_id);

-- Enable realtime for opportunity_updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.opportunity_updates;
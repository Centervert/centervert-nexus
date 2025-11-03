-- Create opportunity quote items table
CREATE TABLE IF NOT EXISTS public.opportunity_quote_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  item_type TEXT NOT NULL DEFAULT 'one_time' CHECK (item_type IN ('one_time', 'monthly')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.opportunity_quote_items ENABLE ROW LEVEL SECURITY;

-- Admins can manage all quote items
CREATE POLICY "Admins can manage opportunity quote items"
  ON public.opportunity_quote_items
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_opportunity_quote_items_updated_at
  BEFORE UPDATE ON public.opportunity_quote_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add index for performance
CREATE INDEX idx_opportunity_quote_items_opportunity_id ON public.opportunity_quote_items(opportunity_id);
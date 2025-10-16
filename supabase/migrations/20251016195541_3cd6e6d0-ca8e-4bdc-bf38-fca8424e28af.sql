-- Create system_settings table for application-wide configuration
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can view settings (needed for UI to check if features are enabled)
CREATE POLICY "Anyone can view settings"
  ON public.system_settings
  FOR SELECT
  USING (true);

-- Only admins can manage settings
CREATE POLICY "Only admins can manage settings"
  ON public.system_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default Stripe setting (disabled by default)
INSERT INTO public.system_settings (setting_key, setting_value)
VALUES ('stripe_enabled', 'false'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
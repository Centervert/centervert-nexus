-- Create app_role enum
CREATE TYPE app_role AS ENUM ('admin', 'agent', 'user');

-- Create user_roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- Assign default 'user' role
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles" ON user_roles
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage roles" ON user_roles
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create function to get users with roles
CREATE OR REPLACE FUNCTION get_users_with_roles()
RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  roles TEXT[],
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.avatar_url,
    ARRAY_AGG(ur.role::TEXT) as roles,
    p.created_at
  FROM profiles p
  LEFT JOIN user_roles ur ON ur.user_id = p.id
  GROUP BY p.id, p.email, p.full_name, p.avatar_url, p.created_at
  ORDER BY p.created_at DESC
$$;

-- Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Insert default categories
INSERT INTO categories (name, description) VALUES
  ('Technical Help', 'IT and technical support requests'),
  ('Email Creation', 'Email campaign design and setup'),
  ('Website Development', 'Website design and development'),
  ('Landing Page', 'Landing page creation'),
  ('Build Out', 'CRM/ERP system setup and configuration');

-- RLS for categories
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage categories" ON categories
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create ticket enums
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'awaiting_response', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create tickets table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status ticket_status DEFAULT 'open' NOT NULL,
  priority ticket_priority DEFAULT 'medium' NOT NULL,
  category_id UUID REFERENCES categories(id),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX idx_tickets_created_by ON tickets(created_by);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);

-- RLS Policies for tickets
CREATE POLICY "Users can create tickets" ON tickets
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can view their own tickets" ON tickets
  FOR SELECT USING (
    created_by = auth.uid() 
    OR assigned_to = auth.uid() 
    OR has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'agent')
  );

CREATE POLICY "Users can update own tickets or assigned tickets" ON tickets
  FOR UPDATE USING (
    created_by = auth.uid() 
    OR assigned_to = auth.uid() 
    OR has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'agent')
  );

CREATE POLICY "Only admins can delete tickets" ON tickets
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Create comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX idx_comments_ticket_id ON comments(ticket_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- RLS Policies for comments
CREATE POLICY "Users can view comments on their tickets" ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = comments.ticket_id
      AND (
        tickets.created_by = auth.uid() 
        OR tickets.assigned_to = auth.uid() 
        OR has_role(auth.uid(), 'admin') 
        OR has_role(auth.uid(), 'agent')
      )
    )
    AND (NOT is_internal OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'))
  );

CREATE POLICY "Users can create comments on accessible tickets" ON comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = comments.ticket_id
      AND (
        tickets.created_by = auth.uid() 
        OR tickets.assigned_to = auth.uid() 
        OR has_role(auth.uid(), 'admin') 
        OR has_role(auth.uid(), 'agent')
      )
    )
  );

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments or admins can delete any" ON comments
  FOR DELETE USING (
    user_id = auth.uid() 
    OR has_role(auth.uid(), 'admin')
  );

-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', false);

-- Storage RLS policies
CREATE POLICY "Users can upload files to accessible tickets"
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'ticket-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view files from accessible tickets"
ON storage.objects FOR SELECT USING (
  bucket_id = 'ticket-attachments'
);

CREATE POLICY "Users can delete own files or admins can delete any"
ON storage.objects FOR DELETE USING (
  bucket_id = 'ticket-attachments'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);

-- Create attachments table
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_attachments_ticket_id ON attachments(ticket_id);
CREATE INDEX idx_attachments_comment_id ON attachments(comment_id);

-- RLS Policies for attachments
CREATE POLICY "Users can view attachments on accessible tickets" ON attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = attachments.ticket_id
      AND (
        tickets.created_by = auth.uid() 
        OR tickets.assigned_to = auth.uid() 
        OR has_role(auth.uid(), 'admin') 
        OR has_role(auth.uid(), 'agent')
      )
    )
  );

CREATE POLICY "Users can upload attachments to accessible tickets" ON attachments
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM tickets
        WHERE tickets.id = attachments.ticket_id
        AND (
          tickets.created_by = auth.uid() 
          OR tickets.assigned_to = auth.uid() 
          OR has_role(auth.uid(), 'admin') 
          OR has_role(auth.uid(), 'agent')
        )
      )
      OR EXISTS (
        SELECT 1 FROM comments
        WHERE comments.id = attachments.comment_id
        AND comments.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete own attachments or admins can delete any" ON attachments
  FOR DELETE USING (
    uploaded_by = auth.uid() 
    OR has_role(auth.uid(), 'admin')
  );

-- Create function to get available agents
CREATE OR REPLACE FUNCTION get_available_agents()
RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT
    p.id,
    p.email,
    p.full_name
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  WHERE ur.role IN ('admin', 'agent')
  ORDER BY p.full_name
$$;
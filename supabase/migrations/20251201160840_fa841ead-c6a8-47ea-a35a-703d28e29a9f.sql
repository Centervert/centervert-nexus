CREATE TABLE public.expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL,
  frequency text NOT NULL,
  start_date date,
  end_date date,
  vendor text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  CONSTRAINT expenses_pkey PRIMARY KEY (id)
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
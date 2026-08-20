CREATE TABLE public.visitor_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  referrer text,
  page_path text,
  language text,
  screen_width integer,
  screen_height integer,
  timezone text,
  country text,
  region text,
  city text,
  postal text,
  org text,
  latitude double precision,
  longitude double precision,
  accuracy double precision,
  location_granted boolean NOT NULL DEFAULT false
);

GRANT ALL ON public.visitor_logs TO service_role;

ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_visitor_logs_created_at ON public.visitor_logs (created_at DESC);
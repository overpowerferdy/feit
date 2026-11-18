CREATE TABLE public.app_push_keys (
  id text PRIMARY KEY,
  public_key text NOT NULL,
  private_jwk jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.app_push_keys TO service_role;
ALTER TABLE public.app_push_keys ENABLE ROW LEVEL SECURITY;
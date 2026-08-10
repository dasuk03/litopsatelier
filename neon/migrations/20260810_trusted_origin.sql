-- Allow the production GitHub Pages origin to use Litops Atelier Neon Auth.
-- Auth trusted origins are exact origins: paths and trailing slashes are omitted.

update neon_auth.project_config
set trusted_origins = coalesce(trusted_origins, '[]'::jsonb)
  || jsonb_build_array('https://dasuk03.github.io'),
    updated_at = now()
where not (
  coalesce(trusted_origins, '[]'::jsonb) ? 'https://dasuk03.github.io'
);

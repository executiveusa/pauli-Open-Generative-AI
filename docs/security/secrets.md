# Secrets Policy
- Provider credentials must remain backend-only.
- Frontend may only use `NEXT_PUBLIC_*` public vars.
- Dev BYOK, if needed, must be behind `ENABLE_DEV_BYOK=true`.

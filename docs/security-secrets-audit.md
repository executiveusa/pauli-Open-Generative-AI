# Security / Secrets Audit (Phase 1)

## Scope
- Date: 2026-05-10
- Method: static pattern search + targeted source inspection.

## Commands used
- `rg -n "(sk-|hf_|fal_|MUAPI|FAL|HUGGINGFACE|OPENAI|API_KEY|SECRET|TOKEN)" . --glob '!node_modules' --glob '!*.lock' --glob '!storage'`
- `rg -n "localStorage|apiKey|MUAPI|FAL|HF_TOKEN|HUGGINGFACE|x-api-key|BYOK|ApiKeyModal" app components packages/studio src electron`

## Key findings
1. Browser-side API key storage exists (`localStorage` key `muapi_key`) and is used broadly in UI components.
2. `x-api-key` is passed directly from browser-side clients into provider-facing calls.
3. Existing Next route proxies forward API keys and include debug logging with masked key prefixes.
4. Legacy and package-level studio components both include BYOK-oriented flows.

## Risk level
- High for production secretless requirement compliance.

## Recommended mitigation for next phases
- Introduce backend token vault/credential references.
- Replace browser-provider direct calls with backend job endpoints.
- Gate any dev-only BYOK behavior behind `ENABLE_DEV_BYOK=true`.
- Remove/normalize key-bearing debug logs.

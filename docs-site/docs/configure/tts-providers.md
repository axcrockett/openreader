---
title: TTS Providers
---

OpenReader routes all TTS requests through the Next.js server to an OpenAI-compatible API. You choose your provider and credentials in one of two places:

**Environment variables**: set in your `.env` or `docker-compose.yml` as server-level defaults. Applied when the user has no saved Settings.

**Settings modal** (Settings > TTS Provider): stored in the browser and sent with every TTS request. **Overrides env vars.**

:::note
Set env vars as deployment-level defaults. Users (or you, in a single-user setup) can then change the provider, base URL, and API key from the Settings modal without redeploying. Clearing the Settings fields falls back to the env var defaults.
:::

## Providers

- **OpenAI**: Cloud. Base URL pre-filled (`https://api.openai.com/v1`). API key required.
- **Replicate**: Cloud. Base URL managed internally by OpenReader. API key required.
- **Deepinfra**: Cloud. Base URL pre-filled (`https://api.deepinfra.com/v1/openai`). API key required.
- **Custom OpenAI-Like**: Self-hosted or any custom endpoint. `API_BASE` must be set manually (typically ending in `/v1`). API key optional.

For `OpenAI`, `Deepinfra`, and `Replicate` you only need to supply an API key. For `Custom OpenAI-Like` you must also set `API_BASE`.

## Built-in model catalogs

- **Replicate** models: `google/gemini-3.1-flash-tts`, `minimax/speech-2.8-turbo`, `qwen/qwen3-tts`, `inworld/tts-1.5-mini` (or choose `Other` and enter any Replicate model ID)
- **OpenAI** models: `tts-1`, `tts-1-hd`, `gpt-4o-mini-tts`
- **Deepinfra** models: includes `hexgrad/Kokoro-82M` and additional hosted models (depending on API key / feature flags)

## Custom provider requirements

Self-hosted or custom providers must expose OpenAI-compatible audio endpoints:

- `GET /v1/audio/voices`
- `POST /v1/audio/speech`

:::warning TTS requests are server-side
TTS requests originate from the **Next.js server**, not the browser. `API_BASE` must be reachable from the server runtime. In Docker, use container names or `host.docker.internal` rather than `localhost`.
:::

## Provider guides

- [Kokoro-FastAPI](./tts-provider-guides/kokoro-fastapi)
- [KittenTTS-FastAPI](./tts-provider-guides/kitten-tts-fastapi)
- [Orpheus-FastAPI](./tts-provider-guides/orpheus-fastapi)
- [Replicate](./tts-provider-guides/replicate)
- [DeepInfra](./tts-provider-guides/deepinfra)
- [OpenAI](./tts-provider-guides/openai)
- [Other](./tts-provider-guides/other)

## Related

- [TTS Environment Variables](../reference/environment-variables#tts-provider-and-request-behavior)
- [TTS Rate Limiting](./tts-rate-limiting)

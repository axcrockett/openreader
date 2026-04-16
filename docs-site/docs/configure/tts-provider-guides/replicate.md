---
title: Replicate
---

Use Replicate's hosted TTS models as your provider.

## Setup

**Environment variables (recommended for deployment):**

```env
API_KEY=r8_...
NEXT_PUBLIC_DEFAULT_TTS_PROVIDER=replicate
NEXT_PUBLIC_DEFAULT_TTS_MODEL=google/gemini-3.1-flash-tts
```

**Or in-app via Settings -> TTS Provider:**

1. Set provider to `Replicate`.
2. Enter your `API_KEY`.
3. Choose a model and voice.

Settings modal values override env vars. See [TTS Providers](../tts-providers) for how the two layers interact.

## Notes

- Built-in Replicate models:
  - `google/gemini-3.1-flash-tts`
  - `minimax/speech-2.8-turbo`
  - `qwen/qwen3-tts`
  - `inworld/tts-1.5-mini`
- Native model speed is not available on all Replicate models; OpenReader hides/disables native speed controls where unsupported.
- TTS requests are sent from the server, not the browser. The API key is never exposed to clients.

## References

- [Replicate](https://replicate.com/explore)
- [TTS Providers](../tts-providers)
- [TTS Environment Variables](../../reference/environment-variables#tts-provider-and-request-behavior)

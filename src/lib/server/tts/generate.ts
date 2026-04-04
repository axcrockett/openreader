import OpenAI from 'openai';
import { SpeechCreateParams } from 'openai/resources/audio/speech.mjs';
import { isKokoroModel } from '@/lib/shared/kokoro';
import { supportsTtsInstructions } from '@/lib/shared/tts-provider-catalog';
import { LRUCache } from 'lru-cache';
import { createHash } from 'crypto';
import { access, readFile } from 'fs/promises';
import { resolve } from 'path';

export interface ServerTTSRequest {
  text: string;
  voice: string;
  speed: number;
  format?: string;
  model?: string | null;
  instructions?: string;
  provider: string;
  apiKey: string;
  baseUrl?: string;
  testNamespace?: string | null;
}

type CustomVoice = string;
type ExtendedSpeechParams = Omit<SpeechCreateParams, 'voice'> & {
  voice: SpeechCreateParams['voice'] | CustomVoice;
  instructions?: string;
};

type ResolvedServerTTSRequest = {
  text: string;
  voice: string;
  speed: number;
  format: string;
  model: SpeechCreateParams['model'];
  instructions?: string;
  provider: string;
  apiKey: string;
  baseUrl?: string;
  testNamespace?: string | null;
};

type InflightEntry = {
  promise: Promise<Buffer>;
  controller: AbortController;
  consumers: number;
};

const TTS_CACHE_MAX_SIZE_BYTES = Number(process.env.TTS_CACHE_MAX_SIZE_BYTES || 256 * 1024 * 1024); // 256MB
const TTS_CACHE_TTL_MS = Number(process.env.TTS_CACHE_TTL_MS || 1000 * 60 * 30); // 30 minutes

const ttsAudioCache = new LRUCache<string, Buffer>({
  maxSize: TTS_CACHE_MAX_SIZE_BYTES,
  sizeCalculation: (value) => value.byteLength,
  ttl: TTS_CACHE_TTL_MS,
});

const inflightRequests = new Map<string, InflightEntry>();

const TEST_TTS_MOCK_PATH = resolve(process.cwd(), 'tests/files/sample.mp3');
let testMockTtsBufferPromise: Promise<Buffer | null> | null = null;

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

function getUpstreamStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const rec = error as Record<string, unknown>;
  if (typeof rec.status === 'number') return rec.status;
  if (typeof rec.statusCode === 'number') return rec.statusCode;
  return undefined;
}

function resolveTTSRequest(input: ServerTTSRequest): ResolvedServerTTSRequest {
  const provider = input.provider || 'openai';
  const rawModel = provider === 'deepinfra' && !input.model ? 'hexgrad/Kokoro-82M' : input.model;
  const model = (rawModel ?? 'gpt-4o-mini-tts') as SpeechCreateParams['model'];

  const normalizedVoice = (
    !isKokoroModel(model as string) && input.voice.includes('+')
      ? input.voice.split('+')[0].trim()
      : input.voice
  ) as string;

  const format = input.format || 'mp3';
  const speed = Number.isFinite(Number(input.speed)) ? Number(input.speed) : 1;
  const instructions = supportsTtsInstructions(model as string) && input.instructions
    ? input.instructions
    : undefined;

  return {
    text: input.text,
    voice: normalizedVoice,
    speed,
    format,
    model,
    instructions,
    provider,
    apiKey: input.apiKey,
    baseUrl: input.baseUrl,
    testNamespace: input.testNamespace || null,
  };
}

function makeCacheKey(input: {
  provider: string;
  model: string | null | undefined;
  voice: string | undefined;
  speed: number;
  format: string;
  text: string;
  instructions?: string;
  testNamespace?: string | null;
}) {
  const canonical = {
    provider: input.provider,
    model: input.model || '',
    voice: input.voice || '',
    speed: input.speed,
    format: input.format,
    text: input.text,
    instructions: input.instructions || undefined,
    testNamespace: input.testNamespace || undefined,
  };
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}

export function buildTTSCacheKey(request: ServerTTSRequest): string {
  const resolved = resolveTTSRequest(request);
  return makeCacheKey({
    provider: resolved.provider,
    model: resolved.model,
    voice: resolved.voice,
    speed: resolved.speed,
    format: resolved.format,
    text: resolved.text,
    instructions: resolved.instructions,
    testNamespace: resolved.testNamespace,
  });
}

export function getCachedTTSBuffer(cacheKey: string): Buffer | undefined {
  return ttsAudioCache.get(cacheKey);
}

export function getTTSContentType(format: string | undefined): string {
  return (format || 'mp3') === 'mp3' ? 'audio/mpeg' : 'application/octet-stream';
}

async function getTestMockTtsBuffer(testNamespace?: string | null): Promise<Buffer | null> {
  if (!testNamespace) return null;
  if (!testMockTtsBufferPromise) {
    testMockTtsBufferPromise = (async () => {
      try {
        await access(TEST_TTS_MOCK_PATH);
      } catch {
        return null;
      }
      return readFile(TEST_TTS_MOCK_PATH);
    })();
  }
  return testMockTtsBufferPromise;
}

async function fetchTTSBufferWithRetry(
  openai: OpenAI,
  createParams: ExtendedSpeechParams,
  signal: AbortSignal
): Promise<Buffer> {
  let attempt = 0;
  const maxRetries = Number(process.env.TTS_MAX_RETRIES ?? 2);
  let delay = Number(process.env.TTS_RETRY_INITIAL_MS ?? 250);
  const maxDelay = Number(process.env.TTS_RETRY_MAX_MS ?? 2000);
  const backoff = Number(process.env.TTS_RETRY_BACKOFF ?? 2);

  for (; ;) {
    try {
      const response = await openai.audio.speech.create(createParams as SpeechCreateParams, { signal });
      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      if (signal.aborted || (error instanceof Error && error.name === 'AbortError')) {
        throw error;
      }

      const status = getUpstreamStatus(error) ?? 0;
      const retryable = status === 429 || status >= 500;
      if (!retryable || attempt >= maxRetries) {
        throw error;
      }

      await sleep(Math.min(delay, maxDelay));
      delay = Math.min(maxDelay, delay * backoff);
      attempt += 1;
    }
  }
}

async function runProviderRequest(request: ResolvedServerTTSRequest, signal: AbortSignal): Promise<Buffer> {
  const mockBuffer = await getTestMockTtsBuffer(request.testNamespace);
  if (mockBuffer) return mockBuffer;

  const openai = new OpenAI({
    apiKey: request.apiKey,
    baseURL: request.baseUrl,
    maxRetries: 0,
    timeout: Number(process.env.TTS_UPSTREAM_TIMEOUT_MS ?? 45_000),
  });

  const createParams: ExtendedSpeechParams = {
    model: request.model,
    voice: request.voice as SpeechCreateParams['voice'],
    input: request.text,
    speed: request.speed,
    response_format: request.format as SpeechCreateParams['response_format'],
  };

  if (request.instructions) {
    createParams.instructions = request.instructions;
  }

  return fetchTTSBufferWithRetry(openai, createParams, signal);
}

export async function generateTTSBuffer(
  request: ServerTTSRequest,
  signal?: AbortSignal
): Promise<Buffer> {
  const resolved = resolveTTSRequest(request);
  const cacheKey = makeCacheKey({
    provider: resolved.provider,
    model: resolved.model,
    voice: resolved.voice,
    speed: resolved.speed,
    format: resolved.format,
    text: resolved.text,
    instructions: resolved.instructions,
    testNamespace: resolved.testNamespace,
  });

  const cachedBuffer = ttsAudioCache.get(cacheKey);
  if (cachedBuffer) return cachedBuffer;

  const existing = inflightRequests.get(cacheKey);
  if (existing) {
    existing.consumers += 1;

    const onAbort = () => {
      existing.consumers = Math.max(0, existing.consumers - 1);
      if (existing.consumers === 0) {
        existing.controller.abort();
      }
    };

    signal?.addEventListener('abort', onAbort, { once: true });
    try {
      return await existing.promise;
    } finally {
      try {
        signal?.removeEventListener('abort', onAbort);
      } catch { }
    }
  }

  const controller = new AbortController();
  const entry: InflightEntry = {
    controller,
    consumers: 1,
    promise: (async () => {
      try {
        const buffer = await runProviderRequest(resolved, controller.signal);
        ttsAudioCache.set(cacheKey, buffer);
        return buffer;
      } finally {
        inflightRequests.delete(cacheKey);
      }
    })(),
  };

  inflightRequests.set(cacheKey, entry);

  const onAbort = () => {
    entry.consumers = Math.max(0, entry.consumers - 1);
    if (entry.consumers === 0) {
      entry.controller.abort();
    }
  };

  signal?.addEventListener('abort', onAbort, { once: true });
  try {
    return await entry.promise;
  } finally {
    try {
      signal?.removeEventListener('abort', onAbort);
    } catch { }
  }
}

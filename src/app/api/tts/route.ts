import { NextRequest, NextResponse } from 'next/server';
import type { TTSRequestPayload } from '@/types/client';
import type { TTSError } from '@/types/tts';
import { headers } from 'next/headers';
import { auth } from '@/lib/server/auth/auth';
import { rateLimiter, RATE_LIMITS, isTtsRateLimitEnabled } from '@/lib/server/rate-limit/rate-limiter';
import { isAuthEnabled } from '@/lib/server/auth/config';
import { getClientIp } from '@/lib/server/rate-limit/request-ip';
import { getOrCreateDeviceId, setDeviceIdCookie } from '@/lib/server/rate-limit/device-id';
import { getOpenReaderTestNamespace } from '@/lib/server/testing/test-namespace';
import {
  buildTTSCacheKey,
  generateTTSBuffer,
  getCachedTTSBuffer,
  getTTSContentType,
} from '@/lib/server/tts/generate';

export const runtime = 'nodejs';
export const maxDuration = 60;

function attachDeviceIdCookie(response: NextResponse, deviceId: string | null, didCreate: boolean) {
  if (didCreate && deviceId) {
    setDeviceIdCookie(response, deviceId);
  }
}

const PROBLEM_TYPES = {
  dailyQuotaExceeded: 'https://openreader.app/problems/daily-quota-exceeded',
  upstreamRateLimited: 'https://openreader.app/problems/upstream-rate-limited',
} as const;

type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  code?: string;
  [key: string]: unknown;
};

function formatLimitForHint(limit: number): string {
  if (!Number.isFinite(limit) || limit <= 0) return String(limit);
  if (limit >= 1_000_000) {
    const m = limit / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (limit >= 1_000) return `${Math.round(limit / 1_000)}K`;
  return String(limit);
}

function getUpstreamStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const rec = error as Record<string, unknown>;
  if (typeof rec.status === 'number') return rec.status;
  if (typeof rec.statusCode === 'number') return rec.statusCode;
  const response = rec.response as { status?: unknown } | undefined;
  if (response && typeof response.status === 'number') return response.status;
  return undefined;
}

function getUpstreamRetryAfterSeconds(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const rec = error as Record<string, unknown>;
  const response = rec.response as { headers?: { get?: (name: string) => string | null } } | undefined;
  const retryAfterHeader = response?.headers?.get?.('retry-after');
  if (!retryAfterHeader) return undefined;
  const parsed = Number(retryAfterHeader);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return Math.ceil(parsed);
}

export async function POST(req: NextRequest) {
  let providerForError: string | null = null;
  let didCreateDeviceIdCookie = false;
  let deviceIdToSet: string | null = null;

  try {
    const body = (await req.json()) as TTSRequestPayload;
    const { text, voice, speed, format, model: reqModel, instructions } = body;

    if (!text || !voice || !speed) {
      const errorBody: TTSError = {
        code: 'MISSING_PARAMETERS',
        message: 'Missing required parameters',
      };
      return NextResponse.json(errorBody, { status: 400 });
    }

    if (isAuthEnabled() && auth) {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session?.user) {
        return NextResponse.json(
          { code: 'UNAUTHORIZED', message: 'Authentication required' },
          { status: 401 }
        );
      }

      const isAnonymous = Boolean(session.user.isAnonymous);
      if (isTtsRateLimitEnabled()) {
        const charCount = text.length;
        const ip = getClientIp(req);
        const device = isAnonymous ? getOrCreateDeviceId(req) : null;
        if (device?.didCreate) {
          didCreateDeviceIdCookie = true;
          deviceIdToSet = device.deviceId;
        }

        const rateLimitResult = await rateLimiter.checkAndIncrementLimit(
          { id: session.user.id, isAnonymous },
          charCount,
          {
            deviceId: device?.deviceId ?? null,
            ip,
          }
        );

        if (!rateLimitResult.allowed) {
          const resetTimeMs = rateLimitResult.resetTimeMs;
          const retryAfterSeconds = Math.max(
            0,
            Math.ceil((resetTimeMs - Date.now()) / 1000)
          );

          const problem: ProblemDetails = {
            type: PROBLEM_TYPES.dailyQuotaExceeded,
            title: 'Daily quota exceeded',
            status: 429,
            detail: 'Daily character limit exceeded',
            code: 'USER_DAILY_QUOTA_EXCEEDED',
            currentCount: rateLimitResult.currentCount,
            limit: rateLimitResult.limit,
            remainingChars: rateLimitResult.remainingChars,
            resetTimeMs,
            userType: isAnonymous ? 'anonymous' : 'authenticated',
            upgradeHint: isAnonymous
              ? `Sign up to increase your limit from ${formatLimitForHint(RATE_LIMITS.ANONYMOUS)} to ${formatLimitForHint(RATE_LIMITS.AUTHENTICATED)} characters per day`
              : undefined,
            instance: req.nextUrl.pathname,
          };

          const response = new NextResponse(JSON.stringify(problem), {
            status: 429,
            headers: {
              'Content-Type': 'application/problem+json',
              'Retry-After': String(retryAfterSeconds),
            },
          });

          attachDeviceIdCookie(response, deviceIdToSet, didCreateDeviceIdCookie);
          return response;
        }
      }
    }

    const openApiKey = req.headers.get('x-openai-key') || process.env.API_KEY || 'none';
    const openApiBaseUrl = req.headers.get('x-openai-base-url') || process.env.API_BASE;
    const provider = req.headers.get('x-tts-provider') || 'openai';
    const testNamespace = getOpenReaderTestNamespace(req.headers);
    providerForError = provider;
    const varyHeader = 'x-tts-provider, x-openai-key, x-openai-base-url, x-openreader-test-namespace';

    const ttsRequest = {
      text,
      voice,
      speed,
      format,
      model: reqModel,
      instructions,
      provider,
      apiKey: openApiKey,
      baseUrl: openApiBaseUrl,
      testNamespace,
    };

    const contentType = getTTSContentType(format);
    const cacheKey = buildTTSCacheKey(ttsRequest);
    const etag = `W/"${cacheKey}"`;
    const ifNoneMatch = req.headers.get('if-none-match');

    const cachedBuffer = getCachedTTSBuffer(cacheKey);
    if (cachedBuffer) {
      if (ifNoneMatch && (ifNoneMatch.includes(cacheKey) || ifNoneMatch.includes(etag))) {
        const response = new NextResponse(null, {
          status: 304,
          headers: {
            ETag: etag,
            'Cache-Control': 'private, max-age=1800',
            Vary: varyHeader,
          },
        });

        attachDeviceIdCookie(response, deviceIdToSet, didCreateDeviceIdCookie);
        return response;
      }

      const response = new NextResponse(new Uint8Array(cachedBuffer), {
        headers: {
          'Content-Type': contentType,
          'X-Cache': 'HIT',
          ETag: etag,
          'Content-Length': String(cachedBuffer.byteLength),
          'Cache-Control': 'private, max-age=1800',
          Vary: varyHeader,
        },
      });

      attachDeviceIdCookie(response, deviceIdToSet, didCreateDeviceIdCookie);
      return response;
    }

    const buffer = await generateTTSBuffer(ttsRequest, req.signal);

    const response = new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'X-Cache': 'MISS',
        ETag: etag,
        'Content-Length': String(buffer.byteLength),
        'Cache-Control': 'private, max-age=1800',
        Vary: varyHeader,
      },
    });

    attachDeviceIdCookie(response, deviceIdToSet, didCreateDeviceIdCookie);
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return new NextResponse(null, { status: 499 });
    }

    const upstreamStatus = getUpstreamStatus(error);
    if (upstreamStatus === 429) {
      const retryAfterSeconds = getUpstreamRetryAfterSeconds(error);
      const problem: ProblemDetails = {
        type: PROBLEM_TYPES.upstreamRateLimited,
        title: 'Upstream rate limited',
        status: 429,
        detail: retryAfterSeconds
          ? `The TTS provider is rate limiting requests. Please retry in about ${retryAfterSeconds}s.`
          : 'The TTS provider is rate limiting requests. Please try again shortly.',
        code: 'UPSTREAM_RATE_LIMIT',
        provider: providerForError ?? undefined,
        upstreamStatus,
        retryAfterSeconds,
        instance: req.nextUrl.pathname,
      };

      return new NextResponse(JSON.stringify(problem), {
        status: 429,
        headers: {
          'Content-Type': 'application/problem+json',
          ...(retryAfterSeconds ? { 'Retry-After': String(retryAfterSeconds) } : {}),
        },
      });
    }

    const statusHint = getUpstreamStatus(error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(
      `Error generating TTS${typeof statusHint === 'number' ? ` (upstream ${statusHint})` : ''}: ${errorMessage}`,
    );
    const errorBody: TTSError = {
      code: 'TTS_GENERATION_FAILED',
      message: 'Failed to generate audio',
      details: process.env.NODE_ENV !== 'production' ? String(error) : undefined,
    };
    return NextResponse.json(errorBody, { status: 500 });
  }
}

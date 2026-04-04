import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/server/auth/auth';
import { getDefaultVoices, resolveVoices } from '@/lib/shared/tts-provider-catalog';

export async function GET(req: NextRequest) {
  try {
    // Auth check - require session
    const session = await auth?.api.getSession({ headers: req.headers });
    if (auth && !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const openApiKey = req.headers.get('x-openai-key') || process.env.API_KEY || 'none';
    const openApiBaseUrl = req.headers.get('x-openai-base-url') || process.env.API_BASE;
    const provider = req.headers.get('x-tts-provider') || 'openai';
    const model = req.headers.get('x-tts-model') || 'tts-1';
    const voices = await resolveVoices({
      provider,
      model,
      apiKey: openApiKey,
      baseUrl: openApiBaseUrl,
    });
    return NextResponse.json({ voices });
  } catch (error) {
    console.error('Error in voices endpoint:', error);
    const provider = req.headers.get('x-tts-provider') || 'openai';
    const model = req.headers.get('x-tts-model') || 'tts-1';
    return NextResponse.json({ voices: getDefaultVoices(provider, model) });
  }
}

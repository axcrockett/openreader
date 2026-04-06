import { isKokoroModel } from '@/lib/shared/kokoro';

export type TtsProviderId = 'custom-openai' | 'deepinfra' | 'openai';
export type TtsVoiceSource = 'static' | 'deepinfra-api' | 'custom-openai-api';

export interface TtsModelDefinition {
  id: string;
  name: string;
}

export interface TtsProviderDefinition {
  id: TtsProviderId;
  name: string;
  supportsCustomModel: boolean;
  models: (context?: ResolveProviderModelsContext) => TtsModelDefinition[];
}

export interface ResolveProviderModelsContext {
  apiKey?: string;
  showAllDeepInfra?: boolean;
}

export interface ResolveVoicesOptions {
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

const OPENAI_MODELS: TtsModelDefinition[] = [
  { id: 'tts-1', name: 'TTS-1' },
  { id: 'tts-1-hd', name: 'TTS-1 HD' },
  { id: 'gpt-4o-mini-tts', name: 'GPT-4o Mini TTS' },
];

const CUSTOM_OPENAI_MODELS: TtsModelDefinition[] = [
  { id: 'kokoro', name: 'Kokoro' },
  { id: 'kitten-tts', name: 'KittenTTS' },
  { id: 'orpheus', name: 'Orpheus' },
  { id: 'custom', name: 'Other' },
];

const DEEPINFRA_MODELS_FULL: TtsModelDefinition[] = [
  { id: 'hexgrad/Kokoro-82M', name: 'hexgrad/Kokoro-82M' },
  { id: 'canopylabs/orpheus-3b-0.1-ft', name: 'canopylabs/orpheus-3b-0.1-ft' },
  { id: 'sesame/csm-1b', name: 'sesame/csm-1b' },
  { id: 'ResembleAI/chatterbox', name: 'ResembleAI/chatterbox' },
  { id: 'Zyphra/Zonos-v0.1-hybrid', name: 'Zyphra/Zonos-v0.1-hybrid' },
  { id: 'Zyphra/Zonos-v0.1-transformer', name: 'Zyphra/Zonos-v0.1-transformer' },
  { id: 'custom', name: 'Other' },
];

const DEEPINFRA_MODELS_LIMITED: TtsModelDefinition[] = [
  { id: 'hexgrad/Kokoro-82M', name: 'hexgrad/Kokoro-82M' },
];

const DEFAULT_MODELS: TtsModelDefinition[] = [{ id: 'tts-1', name: 'TTS-1' }];

export const OPENAI_DEFAULT_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;
export const GPT4O_MINI_DEFAULT_VOICES = ['alloy', 'ash', 'coral', 'echo', 'fable', 'onyx', 'nova', 'sage', 'shimmer'] as const;
export const CUSTOM_OPENAI_DEFAULT_VOICES = ['af_sarah', 'af_bella', 'af_nicole', 'am_adam', 'am_michael', 'bf_emma', 'bf_isabella', 'bm_george', 'bm_lewis'] as const;
export const KOKORO_DEFAULT_VOICES = [
  'af_alloy', 'af_aoede', 'af_bella', 'af_heart', 'af_jessica', 'af_kore', 'af_nicole', 'af_nova',
  'af_river', 'af_sarah', 'af_sky', 'am_adam', 'am_echo', 'am_eric', 'am_fenrir', 'am_liam',
  'am_michael', 'am_onyx', 'am_puck', 'am_santa', 'bf_alice', 'bf_emma', 'bf_isabella', 'bf_lily',
  'bm_daniel', 'bm_fable', 'bm_george', 'bm_lewis', 'ef_dora', 'em_alex', 'em_santa', 'ff_siwis',
  'hf_alpha', 'hf_beta', 'hm_omega', 'hm_psi', 'if_sara', 'im_nicola', 'jf_alpha', 'jf_gongitsune',
  'jf_nezumi', 'jf_tebukuro', 'jm_kumo', 'pf_dora', 'pm_alex', 'pm_santa', 'zf_xiaobei', 'zf_xiaoni',
  'zf_xiaoxiao', 'zf_xiaoyi', 'zm_yunjian', 'zm_yunxi', 'zm_yunxia', 'zm_yunyang',
] as const;
export const ORPHEUS_DEFAULT_VOICES = ['tara', 'leah', 'jess', 'leo', 'dan', 'mia', 'zac'] as const;
export const SESAME_DEFAULT_VOICES = ['conversational_a', 'conversational_b', 'read_speech_a', 'read_speech_b', 'read_speech_c', 'read_speech_d', 'none'] as const;

export const TTS_PROVIDER_DEFINITIONS: TtsProviderDefinition[] = [
  {
    id: 'custom-openai',
    name: 'Custom OpenAI-Like',
    supportsCustomModel: true,
    models: () => CUSTOM_OPENAI_MODELS,
  },
  {
    id: 'deepinfra',
    name: 'Deepinfra',
    supportsCustomModel: true,
    models: (context) => {
      if (!context?.showAllDeepInfra && !context?.apiKey) {
        return DEEPINFRA_MODELS_LIMITED;
      }
      return DEEPINFRA_MODELS_FULL;
    },
  },
  {
    id: 'openai',
    name: 'OpenAI',
    supportsCustomModel: false,
    models: () => OPENAI_MODELS,
  },
];

export function supportsTtsInstructions(model: string | null | undefined): boolean {
  return model === 'gpt-4o-mini-tts';
}

export function getProviderDefinition(provider: string | null | undefined): TtsProviderDefinition | undefined {
  return TTS_PROVIDER_DEFINITIONS.find((definition) => definition.id === provider);
}

export function resolveProviderModels(provider: string | null | undefined, context?: ResolveProviderModelsContext): TtsModelDefinition[] {
  return getProviderDefinition(provider)?.models(context) ?? DEFAULT_MODELS;
}

export function providerSupportsCustomModel(provider: string | null | undefined): boolean {
  return getProviderDefinition(provider)?.supportsCustomModel ?? false;
}

export function getDefaultVoices(provider: string, model: string): string[] {
  if (provider === 'openai') {
    if (supportsTtsInstructions(model)) {
      return [...GPT4O_MINI_DEFAULT_VOICES];
    }
    return [...OPENAI_DEFAULT_VOICES];
  }

  if (provider === 'custom-openai') {
    if (isKokoroModel(model)) {
      return [...KOKORO_DEFAULT_VOICES];
    }
    return [...CUSTOM_OPENAI_DEFAULT_VOICES];
  }

  if (provider === 'deepinfra') {
    if (model === 'hexgrad/Kokoro-82M') {
      return [...KOKORO_DEFAULT_VOICES];
    }
    if (model === 'canopylabs/orpheus-3b-0.1-ft') {
      return [...ORPHEUS_DEFAULT_VOICES];
    }
    if (model === 'sesame/csm-1b') {
      return [...SESAME_DEFAULT_VOICES];
    }
    if (model === 'ResembleAI/chatterbox') {
      return ['None'];
    }
    if (model === 'Zyphra/Zonos-v0.1-hybrid' || model === 'Zyphra/Zonos-v0.1-transformer') {
      return ['random'];
    }
    return [...CUSTOM_OPENAI_DEFAULT_VOICES];
  }

  return [...OPENAI_DEFAULT_VOICES];
}

export function resolveVoiceSource(provider: string, model: string): TtsVoiceSource {
  if (provider === 'deepinfra' && (
    model === 'ResembleAI/chatterbox' ||
    model === 'Zyphra/Zonos-v0.1-hybrid' ||
    model === 'Zyphra/Zonos-v0.1-transformer'
  )) {
    return 'deepinfra-api';
  }

  if (provider === 'custom-openai') {
    return 'custom-openai-api';
  }

  return 'static';
}

async function fetchDeepinfraVoices(apiKey: string): Promise<string[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 10_000);

  try {
    const response = await fetch('https://api.deepinfra.com/v1/voices', {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Deepinfra voices');
    }

    const data = await response.json();
    if (data.voices && Array.isArray(data.voices)) {
      return data.voices
        .filter((voice: { user_id?: string }) => voice.user_id !== 'preset')
        .map((voice: { name: string }) => voice.name);
    }
    return [];
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return [];
    }
    console.error('Error fetching Deepinfra voices:', error);
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchCustomOpenAiVoices(baseUrl: string, apiKey: string): Promise<string[] | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 10_000);

  try {
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
    const response = await fetch(`${normalizedBaseUrl}/audio/voices`, {
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return Array.isArray(data.voices) && data.voices.every((voice: unknown) => typeof voice === 'string')
      ? data.voices
      : null;
  } catch {
    console.log('Custom endpoint does not support voices, using defaults');
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function resolveVoices({ provider, model, apiKey = '', baseUrl = '' }: ResolveVoicesOptions): Promise<string[]> {
  const defaultVoices = getDefaultVoices(provider, model);
  const voiceSource = resolveVoiceSource(provider, model);

  if (voiceSource === 'deepinfra-api') {
    const apiVoices = await fetchDeepinfraVoices(apiKey);
    if (apiVoices.length > 0) {
      return [...defaultVoices, ...apiVoices];
    }
    return defaultVoices;
  }

  if (voiceSource === 'custom-openai-api') {
    if (!baseUrl) {
      return defaultVoices;
    }
    const apiVoices = await fetchCustomOpenAiVoices(baseUrl, apiKey);
    if (apiVoices !== null) {
      return apiVoices;
    }
  }

  return defaultVoices;
}

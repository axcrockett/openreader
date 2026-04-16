import { isKokoroModel } from '@/lib/shared/kokoro';

export type TtsProviderId = 'custom-openai' | 'replicate' | 'deepinfra' | 'openai';
export type TtsVoiceSource = 'static' | 'deepinfra-api' | 'custom-openai-api' | 'replicate-api';
export type ReplicateVoiceInputKey = 'voice' | 'voice_id' | 'speaker';

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

export const REPLICATE_KOKORO_82M_VERSIONED_MODEL =
  'alphanumericuser/kokoro-82m:89b6fa84e4fa2dd6bd3a96be3e1f12827a3516c9fda8fddbac7a0be131c9a6f5' as const;

const REPLICATE_MODELS: TtsModelDefinition[] = [
  {
    id: REPLICATE_KOKORO_82M_VERSIONED_MODEL,
    name: 'alphanumericuser/kokoro-82m',
  },
  { id: 'google/gemini-3.1-flash-tts', name: 'google/gemini-3.1-flash-tts' },
  { id: 'minimax/speech-2.8-turbo', name: 'minimax/speech-2.8-turbo' },
  { id: 'qwen/qwen3-tts', name: 'qwen/qwen3-tts' },
  { id: 'inworld/tts-1.5-mini', name: 'inworld/tts-1.5-mini' },
  { id: 'custom', name: 'Other' },
];
const REPLICATE_BUILT_IN_MODELS = new Set(REPLICATE_MODELS.map((model) => model.id).filter((id) => id !== 'custom'));
const DEEPINFRA_API_VOICE_MODELS = new Set([
  'ResembleAI/chatterbox',
  'Zyphra/Zonos-v0.1-hybrid',
  'Zyphra/Zonos-v0.1-transformer',
]);

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

// Replicate model voices
export const GEMINI_FLASH_TTS_VOICES = [
  'Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Leda', 'Orus', 'Aoede',
  'Callirrhoe', 'Autonoe', 'Enceladus', 'Iapetus', 'Umbriel', 'Algenib',
  'Despina', 'Erinome', 'Laomedeia', 'Achernar', 'Algieba', 'Schedar',
  'Gacrux', 'Pulcherrima', 'Achird', 'Zubenelgenubi', 'Vindemiatrix',
  'Sadachbia', 'Sadaltager', 'Sulafat', 'Alnilam', 'Rasalgethi',
] as const;
export const MINIMAX_SPEECH_VOICES = [
  'Deep_Voice_Man', 'Imposing_Manner', 'Elegant_Man', 'Casual_Guy',
  'Friendly_Person', 'Decent_Boy', 'Lively_Girl', 'Exuberant_Girl',
  'Inspirational_girl', 'Young_Knight', 'Abbess', 'Wise_Woman',
] as const;
export const QWEN3_TTS_VOICES = ['Aiden', 'Dylan'] as const;
export const INWORLD_TTS_VOICES = ['Ashley', 'Dennis', 'Alex', 'Darlene'] as const;
const REPLICATE_VOICE_KEYS: readonly ReplicateVoiceInputKey[] = ['voice', 'voice_id', 'speaker'];
const REPLICATE_DEFAULT_VOICES_BY_MODEL: Record<string, readonly string[]> = {
  [REPLICATE_KOKORO_82M_VERSIONED_MODEL]: KOKORO_DEFAULT_VOICES,
  'google/gemini-3.1-flash-tts': GEMINI_FLASH_TTS_VOICES,
  'minimax/speech-2.8-turbo': MINIMAX_SPEECH_VOICES,
  'qwen/qwen3-tts': QWEN3_TTS_VOICES,
  'inworld/tts-1.5-mini': INWORLD_TTS_VOICES,
};
const DEEPINFRA_DEFAULT_VOICES_BY_MODEL: Record<string, readonly string[]> = {
  'hexgrad/Kokoro-82M': KOKORO_DEFAULT_VOICES,
  'canopylabs/orpheus-3b-0.1-ft': ORPHEUS_DEFAULT_VOICES,
  'sesame/csm-1b': SESAME_DEFAULT_VOICES,
  'ResembleAI/chatterbox': ['None'],
  'Zyphra/Zonos-v0.1-hybrid': ['random'],
  'Zyphra/Zonos-v0.1-transformer': ['random'],
};
const replicateVoiceInputKeyCache = new Map<string, ReplicateVoiceInputKey>();
const replicateOpenApiSchemaPromiseCache = new Map<string, Promise<unknown | null>>();

export const TTS_PROVIDER_DEFINITIONS: TtsProviderDefinition[] = [
  {
    id: 'custom-openai',
    name: 'Custom OpenAI-Like',
    supportsCustomModel: true,
    models: () => CUSTOM_OPENAI_MODELS,
  },
  {
    id: 'replicate',
    name: 'Replicate',
    supportsCustomModel: true,
    models: () => REPLICATE_MODELS,
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

const MODELS_WITH_INSTRUCTIONS = new Set([
  'gpt-4o-mini-tts',
  'google/gemini-3.1-flash-tts',
  'qwen/qwen3-tts',
]);

const REPLICATE_MODELS_WITHOUT_NATIVE_SPEED = new Set([
  'google/gemini-3.1-flash-tts',
  'qwen/qwen3-tts',
]);

export function supportsTtsInstructions(model: string | null | undefined): boolean {
  return !!model && MODELS_WITH_INSTRUCTIONS.has(model);
}

export function supportsNativeModelSpeed(provider: string | null | undefined, model: string | null | undefined): boolean {
  if (!model) {
    return true;
  }

  if (provider === 'replicate') {
    return !REPLICATE_MODELS_WITHOUT_NATIVE_SPEED.has(model);
  }

  return true;
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
    return supportsTtsInstructions(model) ? [...GPT4O_MINI_DEFAULT_VOICES] : [...OPENAI_DEFAULT_VOICES];
  }

  if (provider === 'custom-openai') {
    return isKokoroModel(model) ? [...KOKORO_DEFAULT_VOICES] : [...CUSTOM_OPENAI_DEFAULT_VOICES];
  }

  if (provider === 'replicate') {
    return REPLICATE_DEFAULT_VOICES_BY_MODEL[model] ? [...REPLICATE_DEFAULT_VOICES_BY_MODEL[model]] : ['default'];
  }

  if (provider === 'deepinfra') {
    return DEEPINFRA_DEFAULT_VOICES_BY_MODEL[model]
      ? [...DEEPINFRA_DEFAULT_VOICES_BY_MODEL[model]]
      : [...CUSTOM_OPENAI_DEFAULT_VOICES];
  }

  return [...OPENAI_DEFAULT_VOICES];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseReplicateModelIdentifier(model: string): {
  owner: string;
  name: string;
  version?: string;
} | null {
  const [ref, version] = model.split(':', 2);
  const segments = ref.split('/');
  if (segments.length !== 2 || !segments[0] || !segments[1]) {
    return null;
  }

  const parsed = {
    owner: segments[0],
    name: segments[1],
  };

  return version
    ? { ...parsed, version }
    : parsed;
}

function extractSchemaStringEnums(schemaNode: unknown, seen = new Set<object>()): string[] {
  if (!isRecord(schemaNode)) {
    return [];
  }
  if (seen.has(schemaNode)) {
    return [];
  }
  seen.add(schemaNode);

  const values: string[] = [];
  if (Array.isArray(schemaNode.enum)) {
    values.push(...schemaNode.enum.filter((value): value is string => typeof value === 'string'));
  }
  if (typeof schemaNode.const === 'string') {
    values.push(schemaNode.const);
  }

  for (const key of ['anyOf', 'allOf', 'oneOf'] as const) {
    const branch = schemaNode[key];
    if (!Array.isArray(branch)) continue;
    for (const item of branch) {
      values.push(...extractSchemaStringEnums(item, seen));
    }
  }

  if (schemaNode.items) {
    values.push(...extractSchemaStringEnums(schemaNode.items, seen));
  }

  return values;
}

function walkRecordGraph(root: unknown, visit: (node: Record<string, unknown>) => boolean | void): void {
  if (!isRecord(root)) {
    return;
  }

  const stack: Record<string, unknown>[] = [root];
  const seen = new Set<object>();

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    if (seen.has(current)) {
      continue;
    }
    seen.add(current);

    if (visit(current)) {
      return;
    }

    for (const value of Object.values(current)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (isRecord(item)) {
            stack.push(item);
          }
        }
      } else if (isRecord(value)) {
        stack.push(value);
      }
    }
  }
}

function extractReplicateVoicesFromOpenApiSchema(openApiSchema: unknown): string[] {
  const voices: string[] = [];

  walkRecordGraph(openApiSchema, (node) => {
    const properties = node.properties;
    if (!isRecord(properties)) {
      return;
    }
    for (const key of REPLICATE_VOICE_KEYS) {
      if (!(key in properties)) continue;
      voices.push(...extractSchemaStringEnums(properties[key]));
    }
  });

  return Array.from(
    new Set(
      voices
        .map((voice) => voice.trim())
        .filter((voice) => voice.length > 0)
    )
  );
}

function extractReplicateVoiceInputKeyFromOpenApiSchema(openApiSchema: unknown): ReplicateVoiceInputKey | null {
  let found: ReplicateVoiceInputKey | null = null;

  walkRecordGraph(openApiSchema, (node) => {
    const properties = node.properties;
    if (!isRecord(properties)) {
      return;
    }
    for (const key of REPLICATE_VOICE_KEYS) {
      if (key in properties) {
        found = key;
        return true;
      }
    }
  });

  return found;
}

async function fetchReplicateOpenApiSchema(apiKey: string, model: string): Promise<unknown | null> {
  const parsedModel = parseReplicateModelIdentifier(model);
  if (!parsedModel) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 10_000);

  try {
    const endpoint = parsedModel.version
      ? `https://api.replicate.com/v1/models/${parsedModel.owner}/${parsedModel.name}/versions/${parsedModel.version}`
      : `https://api.replicate.com/v1/models/${parsedModel.owner}/${parsedModel.name}`;

    const response = await fetch(endpoint, {
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
    let openApiSchema: unknown = null;

    if (parsedModel.version) {
      if (isRecord(data)) {
        openApiSchema = data.openapi_schema;
      }
    } else if (isRecord(data) && isRecord(data.latest_version)) {
      openApiSchema = data.latest_version.openapi_schema;
    }

    return openApiSchema;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return null;
    }
    console.error('Error fetching Replicate model schema:', error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getReplicateOpenApiSchemaCached(apiKey: string, model: string): Promise<unknown | null> {
  const cachedPromise = replicateOpenApiSchemaPromiseCache.get(model);
  if (cachedPromise) {
    return cachedPromise;
  }

  const fetchPromise = fetchReplicateOpenApiSchema(apiKey, model);
  replicateOpenApiSchemaPromiseCache.set(model, fetchPromise);

  const schema = await fetchPromise;
  if (schema === null) {
    replicateOpenApiSchemaPromiseCache.delete(model);
  }
  return schema;
}

async function fetchReplicateVoices(apiKey: string, model: string): Promise<string[] | null> {
  const openApiSchema = await getReplicateOpenApiSchemaCached(apiKey, model);
  const apiVoices = extractReplicateVoicesFromOpenApiSchema(openApiSchema);
  return apiVoices.length > 0 ? apiVoices : null;
}

export async function resolveReplicateVoiceInputKey({
  provider,
  model,
  apiKey = '',
}: ResolveVoicesOptions): Promise<ReplicateVoiceInputKey | null> {
  if (provider !== 'replicate' || REPLICATE_BUILT_IN_MODELS.has(model) || !apiKey) {
    return null;
  }

  const cached = replicateVoiceInputKeyCache.get(model);
  if (cached) {
    return cached;
  }

  const openApiSchema = await getReplicateOpenApiSchemaCached(apiKey, model);
  const inputKey = extractReplicateVoiceInputKeyFromOpenApiSchema(openApiSchema);
  if (inputKey) {
    replicateVoiceInputKeyCache.set(model, inputKey);
  }
  return inputKey;
}

export function resolveVoiceSource(provider: string, model: string): TtsVoiceSource {
  if (provider === 'deepinfra' && DEEPINFRA_API_VOICE_MODELS.has(model)) {
    return 'deepinfra-api';
  }

  if (provider === 'replicate' && parseReplicateModelIdentifier(model) !== null) {
    return 'replicate-api';
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

  if (voiceSource === 'replicate-api') {
    if (!apiKey) {
      return defaultVoices;
    }
    const apiVoices = await fetchReplicateVoices(apiKey, model);
    if (apiVoices !== null) {
      return apiVoices;
    }
  }

  return defaultVoices;
}

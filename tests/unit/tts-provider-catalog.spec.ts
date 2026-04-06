import { expect, test } from '@playwright/test';

import {
  getDefaultVoices,
  providerSupportsCustomModel,
  resolveVoices,
  resolveProviderModels,
  supportsTtsInstructions,
} from '../../src/lib/shared/tts-provider-catalog';
import { applyConfigUpdate, getVoicePreferenceKey } from '../../src/lib/client/config/updates';
import { buildSyncedPreferencePatch } from '../../src/lib/client/config/preferences';

test.describe('tts provider catalog', () => {
  test('resolves provider models with Deepinfra gating unchanged', () => {
    expect(resolveProviderModels('openai').map((model) => model.id)).toEqual([
      'tts-1',
      'tts-1-hd',
      'gpt-4o-mini-tts',
    ]);

    expect(resolveProviderModels('deepinfra', {
      showAllDeepInfra: false,
      apiKey: '',
    }).map((model) => model.id)).toEqual([
      'hexgrad/Kokoro-82M',
    ]);

    expect(resolveProviderModels('deepinfra', {
      showAllDeepInfra: false,
      apiKey: 'token',
    }).map((model) => model.id)).toEqual([
      'hexgrad/Kokoro-82M',
      'canopylabs/orpheus-3b-0.1-ft',
      'sesame/csm-1b',
      'ResembleAI/chatterbox',
      'Zyphra/Zonos-v0.1-hybrid',
      'Zyphra/Zonos-v0.1-transformer',
      'custom',
    ]);
  });

  test('resolves default voices and instruction support unchanged', () => {
    expect(getDefaultVoices('openai', 'gpt-4o-mini-tts')).toContain('sage');
    expect(getDefaultVoices('custom-openai', 'kokoro')).toContain('af_sarah');
    expect(getDefaultVoices('deepinfra', 'ResembleAI/chatterbox')).toEqual(['None']);
    expect(getDefaultVoices('deepinfra', 'Zyphra/Zonos-v0.1-transformer')).toEqual(['random']);
    expect(supportsTtsInstructions('gpt-4o-mini-tts')).toBe(true);
    expect(supportsTtsInstructions('tts-1')).toBe(false);
    expect(providerSupportsCustomModel('openai')).toBe(false);
    expect(providerSupportsCustomModel('deepinfra')).toBe(true);
  });

  test('keeps explicit empty custom-openai voices response', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({ voices: [] }),
    }) as Response;

    try {
      await expect(resolveVoices({
        provider: 'custom-openai',
        model: 'kokoro',
        apiKey: 'token',
        baseUrl: 'https://example.com',
      })).resolves.toEqual([]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test.describe('config helpers', () => {
  test('persists voice preferences by provider/model pair', () => {
    expect(getVoicePreferenceKey('openai', 'tts-1')).toBe('openai:tts-1');

    const voiceUpdate = applyConfigUpdate({
      ttsProvider: 'openai',
      ttsModel: 'tts-1',
      savedVoices: {},
    }, 'voice', 'alloy');
    expect(voiceUpdate.storagePatch).toEqual({
      savedVoices: { 'openai:tts-1': 'alloy' },
      voice: 'alloy',
    });

    const providerUpdate = applyConfigUpdate({
      ttsProvider: 'openai',
      ttsModel: 'tts-1',
      savedVoices: {
        'deepinfra:hexgrad/Kokoro-82M': 'af_sarah',
      },
    }, 'ttsProvider', 'deepinfra');
    expect(providerUpdate.storagePatch).toEqual({
      ttsProvider: 'deepinfra',
      voice: '',
    });
  });

  test('builds synced preference patches and honors non-default filtering', () => {
    expect(buildSyncedPreferencePatch({
      voiceSpeed: 1.2,
      baseUrl: 'http://localhost',
      ttsModel: 'kokoro',
    })).toEqual({
      voiceSpeed: 1.2,
      ttsModel: 'kokoro',
    });

    expect(buildSyncedPreferencePatch({
      voiceSpeed: 1,
      ttsModel: 'kokoro',
    }, { nonDefaultOnly: true })).toEqual({});
  });
});

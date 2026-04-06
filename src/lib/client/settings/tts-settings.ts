import {
  TTS_PROVIDER_DEFINITIONS,
  providerSupportsCustomModel,
  resolveProviderModels,
  type TtsModelDefinition,
  type TtsProviderDefinition,
} from '@/lib/shared/tts-provider-catalog';

export interface ResolveTtsSettingsViewModelOptions {
  provider: string;
  apiKey?: string;
  modelValue: string;
  customModelInput: string;
  showAllDeepInfra: boolean;
}

export interface TtsSettingsViewModel {
  providers: TtsProviderDefinition[];
  models: TtsModelDefinition[];
  supportsCustomModel: boolean;
  selectedModelId: string;
  canSubmit: boolean;
}

export function resolveTtsSettingsViewModel({
  provider,
  apiKey,
  modelValue,
  customModelInput,
  showAllDeepInfra,
}: ResolveTtsSettingsViewModelOptions): TtsSettingsViewModel {
  const models = resolveProviderModels(provider, {
    apiKey,
    showAllDeepInfra,
  });
  const supportsCustomModel = providerSupportsCustomModel(provider);
  const isPreset = models.some((model) => model.id === modelValue);
  const selectedModelId = isPreset ? modelValue : (supportsCustomModel ? 'custom' : (models[0]?.id ?? ''));
  const canSubmit = selectedModelId !== 'custom' || (supportsCustomModel && customModelInput.trim().length > 0);

  return {
    providers: TTS_PROVIDER_DEFINITIONS,
    models,
    supportsCustomModel,
    selectedModelId,
    canSubmit,
  };
}

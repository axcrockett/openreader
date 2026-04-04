import { APP_CONFIG_DEFAULTS, type AppConfigValues } from '@/types/config';
import { SYNCED_PREFERENCE_KEYS, type SyncedPreferenceKey, type SyncedPreferencesPatch } from '@/types/user-state';

export function buildSyncedPreferencePatch(
  source: Partial<AppConfigValues>,
  options?: { nonDefaultOnly?: boolean },
): SyncedPreferencesPatch {
  const out: SyncedPreferencesPatch = {};

  for (const key of SYNCED_PREFERENCE_KEYS) {
    if (!(key in source)) continue;
    const value = source[key];
    if (value === undefined) continue;

    if (options?.nonDefaultOnly) {
      const defaultValue = APP_CONFIG_DEFAULTS[key];
      const same =
        typeof value === 'object'
          ? JSON.stringify(value) === JSON.stringify(defaultValue)
          : value === defaultValue;
      if (same) continue;
    }

    (out as Record<SyncedPreferenceKey, unknown>)[key] = value;
  }

  return out;
}

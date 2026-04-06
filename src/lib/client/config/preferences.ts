import { APP_CONFIG_DEFAULTS, type AppConfigValues } from '@/types/config';
import { SYNCED_PREFERENCE_KEYS, type SyncedPreferenceKey, type SyncedPreferencesPatch } from '@/types/user-state';

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function deepEqual(left: unknown, right: unknown): boolean {
  if (left === right) return true;

  if (Array.isArray(left) !== Array.isArray(right)) return false;
  if (isObjectLike(left) !== isObjectLike(right)) return false;

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) return false;
    for (let i = 0; i < left.length; i += 1) {
      if (!deepEqual(left[i], right[i])) return false;
    }
    return true;
  }

  if (isObjectLike(left) && isObjectLike(right)) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) return false;

    for (const key of leftKeys) {
      if (!(key in right)) return false;
      if (!deepEqual(left[key], right[key])) return false;
    }
    return true;
  }

  return false;
}

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
          ? deepEqual(value, defaultValue)
          : value === defaultValue;
      if (same) continue;
    }

    (out as Record<SyncedPreferenceKey, unknown>)[key] = value;
  }

  return out;
}

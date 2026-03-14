import type { ModelId } from './types';
import { MODELS } from './types';
import type { ModelParams } from './modelParams';
import { DEFAULT_MODEL_PARAMS, cloneModelParams, mergeModelParams } from './modelParams';

export interface UserModelPreferences {
  currentModel: ModelId;
  modelParams: ModelParams;
  updatedAt?: Date | string;
}

export const DEFAULT_MODEL_ID: ModelId = 'gemini-3-flash-preview';

export function getDefaultUserModelPreferences(): UserModelPreferences {
  return {
    currentModel: DEFAULT_MODEL_ID,
    modelParams: cloneModelParams(DEFAULT_MODEL_PARAMS),
    updatedAt: new Date(),
  };
}

export function normalizeUserModelPreferences(raw: any): UserModelPreferences {
  if (!raw || typeof raw !== 'object') {
    return getDefaultUserModelPreferences();
  }

  const candidateModel = typeof raw.currentModel === 'string' ? raw.currentModel : undefined;
  const currentModel = candidateModel && MODELS[candidateModel as ModelId]
    ? (candidateModel as ModelId)
    : DEFAULT_MODEL_ID;

  return {
    currentModel,
    modelParams: mergeModelParams(raw.modelParams),
    updatedAt: raw.updatedAt,
  };
}

export function mergeUserModelPreferences(
  existing: UserModelPreferences | null | undefined,
  updates: Partial<UserModelPreferences>
): UserModelPreferences {
  const base = existing ?? getDefaultUserModelPreferences();
  const nextModel =
    updates.currentModel && MODELS[updates.currentModel as ModelId]
      ? (updates.currentModel as ModelId)
      : base.currentModel;

  return {
    currentModel: nextModel,
    modelParams: mergeModelParams(updates.modelParams, base.modelParams),
    updatedAt: new Date(),
  };
}


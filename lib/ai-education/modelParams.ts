export interface ModelParams {
  gemini3Pro?: {
    thinking?: boolean;
    webSearch?: boolean;
  };
}

export const DEFAULT_MODEL_PARAMS: ModelParams = {
  gemini3Pro: {
    thinking: true,
    webSearch: true,
  },
};

export function cloneModelParams(params: ModelParams = DEFAULT_MODEL_PARAMS): ModelParams {
  return JSON.parse(JSON.stringify(params));
}

export function mergeModelParams(
  overrides?: Partial<ModelParams>,
  base?: ModelParams
): ModelParams {
  const reference = cloneModelParams(base ?? DEFAULT_MODEL_PARAMS);

  return {
    gemini3Pro: {
      thinking: overrides?.gemini3Pro?.thinking ?? reference.gemini3Pro?.thinking ?? true,
      webSearch: overrides?.gemini3Pro?.webSearch ?? reference.gemini3Pro?.webSearch ?? true,
    },
  };
}

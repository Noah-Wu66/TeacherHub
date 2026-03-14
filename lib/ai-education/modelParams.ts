export interface ModelParams {
  deepseekReasoner?: {
    thinking?: boolean;
  };
}

export const DEFAULT_MODEL_PARAMS: ModelParams = {
  deepseekReasoner: {
    thinking: true,
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
    deepseekReasoner: {
      thinking: overrides?.deepseekReasoner?.thinking ?? reference.deepseekReasoner?.thinking ?? true,
    },
  };
}

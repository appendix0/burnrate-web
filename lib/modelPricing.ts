// Model pricing lookup — USD per 1M tokens (input / output).
// Verify at provider pricing pages — these change frequently.

type ModelPrice = { inputPer1M: number; outputPer1M: number };

const PRICING: Record<string, ModelPrice> = {
  // ── Anthropic ────────────────────────────────────────────────────────────────
  "claude-opus-4-6":            { inputPer1M: 15.0, outputPer1M: 75.0 },
  "claude-sonnet-4-6":          { inputPer1M: 3.0,  outputPer1M: 15.0 },
  "claude-haiku-4-5-20251001":  { inputPer1M: 0.8,  outputPer1M: 4.0  },
  "claude-3-5-sonnet-20241022": { inputPer1M: 3.0,  outputPer1M: 15.0 },
  "claude-3-5-sonnet-20240620": { inputPer1M: 3.0,  outputPer1M: 15.0 },
  "claude-3-5-haiku-20241022":  { inputPer1M: 0.8,  outputPer1M: 4.0  },
  "claude-3-opus-20240229":     { inputPer1M: 15.0, outputPer1M: 75.0 },
  "claude-3-sonnet-20240229":   { inputPer1M: 3.0,  outputPer1M: 15.0 },
  "claude-3-haiku-20240307":    { inputPer1M: 0.25, outputPer1M: 1.25 },

  // ── OpenAI ───────────────────────────────────────────────────────────────────
  "gpt-4o":                     { inputPer1M: 2.5,  outputPer1M: 10.0 },
  "gpt-4o-2024-11-20":          { inputPer1M: 2.5,  outputPer1M: 10.0 },
  "gpt-4o-mini":                { inputPer1M: 0.15, outputPer1M: 0.6  },
  "gpt-4o-mini-2024-07-18":     { inputPer1M: 0.15, outputPer1M: 0.6  },
  "gpt-4-turbo":                { inputPer1M: 10.0, outputPer1M: 30.0 },
  "gpt-4-turbo-preview":        { inputPer1M: 10.0, outputPer1M: 30.0 },
  "gpt-4":                      { inputPer1M: 30.0, outputPer1M: 60.0 },
  "gpt-3.5-turbo":              { inputPer1M: 0.5,  outputPer1M: 1.5  },
  "o1":                         { inputPer1M: 15.0, outputPer1M: 60.0 },
  "o1-mini":                    { inputPer1M: 3.0,  outputPer1M: 12.0 },
  "o3-mini":                    { inputPer1M: 1.1,  outputPer1M: 4.4  },

  // ── Gemini ───────────────────────────────────────────────────────────────────
  "gemini-2.0-flash":           { inputPer1M: 0.1,   outputPer1M: 0.4  },
  "gemini-2.0-flash-lite":      { inputPer1M: 0.075, outputPer1M: 0.3  },
  "gemini-1.5-pro":             { inputPer1M: 1.25,  outputPer1M: 5.0  },
  "gemini-1.5-flash":           { inputPer1M: 0.075, outputPer1M: 0.3  },
  "gemini-1.5-flash-8b":        { inputPer1M: 0.0375,outputPer1M: 0.15 },
  "gemini-1.0-pro":             { inputPer1M: 0.5,   outputPer1M: 1.5  },
};

// Prefix fallbacks for model variants not listed above
const PREFIX_FALLBACKS: Array<[string, ModelPrice]> = [
  ["claude-opus",   { inputPer1M: 15.0, outputPer1M: 75.0 }],
  ["claude-sonnet", { inputPer1M: 3.0,  outputPer1M: 15.0 }],
  ["claude-haiku",  { inputPer1M: 0.8,  outputPer1M: 4.0  }],
  ["gpt-4o-mini",   { inputPer1M: 0.15, outputPer1M: 0.6  }],
  ["gpt-4o",        { inputPer1M: 2.5,  outputPer1M: 10.0 }],
  ["gpt-4",         { inputPer1M: 10.0, outputPer1M: 30.0 }],
  ["gpt-3.5",       { inputPer1M: 0.5,  outputPer1M: 1.5  }],
  ["gemini-2.0",    { inputPer1M: 0.1,  outputPer1M: 0.4  }],
  ["gemini-1.5",    { inputPer1M: 1.25, outputPer1M: 5.0  }],
  ["gemini-1.0",    { inputPer1M: 0.5,  outputPer1M: 1.5  }],
];

// Last-resort fallback when model is unrecognised
const UNKNOWN_FALLBACK: ModelPrice = { inputPer1M: 3.0, outputPer1M: 15.0 };

export function getModelPrice(model: string): ModelPrice {
  const exact = PRICING[model];
  if (exact) return exact;
  for (const [prefix, price] of PREFIX_FALLBACKS) {
    if (model.startsWith(prefix)) return price;
  }
  return UNKNOWN_FALLBACK;
}

export function calcCost(model: string, inputTokens: number, outputTokens: number): number {
  const { inputPer1M, outputPer1M } = getModelPrice(model);
  return (inputTokens / 1_000_000) * inputPer1M + (outputTokens / 1_000_000) * outputPer1M;
}

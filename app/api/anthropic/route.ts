// CORS proxy for Anthropic Usage API
// Anthropic blocks direct browser requests — this Route Handler forwards them server-side.

import { NextRequest, NextResponse } from "next/server";

type RequestBody = {
  apiKey: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
};

export async function POST(request: NextRequest) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { apiKey, startDate, endDate } = body;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 400 });
  }

  const params = new URLSearchParams({
    start_time: `${startDate}T00:00:00Z`,
    end_time: `${endDate}T23:59:59Z`,
    granularity: "day",
  });

  const res = await fetch(`https://api.anthropic.com/v1/usage?${params}`, {
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // 404 means the usage endpoint isn't available for this key type.
    // Anthropic's usage API requires an Admin API key created in the
    // Anthropic Console under Settings → API Keys (not a standard key).
    if (res.status === 404) {
      return NextResponse.json(
        {
          error: "NotFound",
          message:
            "Usage data not available for this API key. " +
            "Anthropic requires an Admin API key for billing access — " +
            "create one at console.anthropic.com → Settings → API Keys.",
        },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: data.error?.type ?? "AnthropicError", message: data.error?.message ?? res.statusText },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}

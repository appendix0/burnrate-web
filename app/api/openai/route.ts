// CORS proxy for OpenAI Billing Usage API
// OpenAI's billing endpoint blocks direct browser requests — forwarded server-side.

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

  const params = new URLSearchParams({ start_date: startDate, end_date: endDate });

  const res = await fetch(
    `https://api.openai.com/v1/dashboard/billing/usage?${params}`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
    }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { error: data.error?.type ?? "OpenAIError", message: data.error?.message ?? res.statusText },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}

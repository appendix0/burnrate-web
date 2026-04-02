// Gemini API proxy — forwards requests to generativelanguage.googleapis.com and logs usage.
//
// Usage: set your SDK base URL to {APP_URL}/api/proxy/gemini
// Your API key is passed as ?key=... by the SDK — the proxy forwards it unchanged.

import { NextRequest, NextResponse } from "next/server";
import { addProxyLog } from "@/lib/proxyStore";
import { ServiceType } from "@/lib/constants/services";

const UPSTREAM = "https://generativelanguage.googleapis.com";

// Extract model name from path segments, e.g. ["v1beta","models","gemini-1.5-pro:generateContent"]
function extractModel(path: string[]): string {
  for (const segment of path) {
    // matches "gemini-1.5-pro:generateContent" → "gemini-1.5-pro"
    const match = segment.match(/^(gemini[\w.-]+?)(?:[:].+)?$/);
    if (match) return match[1];
  }
  return "unknown";
}

function shouldTrack(path: string[]): boolean {
  const last = path.at(-1) ?? "";
  return last.includes("generateContent") || last.includes("streamGenerateContent");
}

// Gemini streaming: each SSE line is a full GenerateContentResponse JSON.
// The last chunk has the most complete usageMetadata.
function parseStreamUsage(text: string): { inputTokens: number; outputTokens: number } {
  let inputTokens = 0;
  let outputTokens = 0;

  for (const line of text.split("\n")) {
    const trimmed = line.startsWith("data: ") ? line.slice(6) : line.trim();
    if (!trimmed || trimmed === "[DONE]") continue;
    // Gemini may also stream as JSON array elements — strip leading comma
    const cleaned = trimmed.startsWith(",") ? trimmed.slice(1) : trimmed;
    try {
      const json = JSON.parse(cleaned);
      if (json.usageMetadata) {
        inputTokens = json.usageMetadata.promptTokenCount ?? inputTokens;
        outputTokens = json.usageMetadata.candidatesTokenCount ?? outputTokens;
      }
    } catch {
      // skip malformed lines
    }
  }
  return { inputTokens, outputTokens };
}

function buildUpstreamUrl(path: string[], searchParams: URLSearchParams): string {
  const url = new URL(`${UPSTREAM}/${path.join("/")}`);
  searchParams.forEach((v, k) => url.searchParams.set(k, v));
  return url.toString();
}

function forwardHeaders(req: NextRequest): Headers {
  const h = new Headers();
  req.headers.forEach((value, key) => {
    if (key !== "host") h.set(key, value);
  });
  return h;
}

function cleanResponseHeaders(upstream: Headers): Headers {
  const h = new Headers();
  upstream.forEach((value, key) => {
    if (!["content-encoding", "transfer-encoding", "connection"].includes(key)) {
      h.set(key, value);
    }
  });
  return h;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const upstreamUrl = buildUpstreamUrl(path, request.nextUrl.searchParams);
  const track = shouldTrack(path);
  const model = extractModel(path);

  const body = await request.arrayBuffer();
  const upstreamRes = await fetch(upstreamUrl, {
    method: "POST",
    headers: forwardHeaders(request),
    body,
  });

  const resHeaders = cleanResponseHeaders(upstreamRes.headers);

  if (!track || !upstreamRes.ok) {
    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: resHeaders,
    });
  }

  const contentType = upstreamRes.headers.get("content-type") ?? "";
  const isStreaming = contentType.includes("text/event-stream");

  if (isStreaming) {
    const reader = upstreamRes.body!.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              const { inputTokens, outputTokens } = parseStreamUsage(accumulated);
              if (inputTokens > 0 || outputTokens > 0) {
                addProxyLog(ServiceType.Gemini, model, inputTokens, outputTokens);
              }
              controller.close();
              break;
            }
            accumulated += decoder.decode(value, { stream: true });
            controller.enqueue(value);
          }
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, { headers: resHeaders });
  }

  // Non-streaming
  const data = await upstreamRes.json();
  const inputTokens = data.usageMetadata?.promptTokenCount ?? 0;
  const outputTokens = data.usageMetadata?.candidatesTokenCount ?? 0;
  if (inputTokens > 0 || outputTokens > 0) {
    addProxyLog(ServiceType.Gemini, model, inputTokens, outputTokens);
  }
  return NextResponse.json(data, { status: upstreamRes.status, headers: resHeaders });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const upstreamUrl = buildUpstreamUrl(path, request.nextUrl.searchParams);
  const res = await fetch(upstreamUrl, { headers: forwardHeaders(request) });
  return new Response(res.body, {
    status: res.status,
    headers: cleanResponseHeaders(res.headers),
  });
}

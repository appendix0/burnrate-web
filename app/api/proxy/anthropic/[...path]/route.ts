// Anthropic API proxy — forwards requests to api.anthropic.com and logs token usage.
//
// Usage: set your SDK base URL to {APP_URL}/api/proxy/anthropic
// The proxy is transparent — your API key and request/response are unchanged.

import { NextRequest, NextResponse } from "next/server";
import { addProxyLog } from "@/lib/proxyStore";
import { ServiceType } from "@/lib/constants/services";

const UPSTREAM = "https://api.anthropic.com";

function parseStreamUsage(text: string): {
  model: string;
  inputTokens: number;
  outputTokens: number;
} {
  let model = "unknown";
  let inputTokens = 0;
  let outputTokens = 0;

  for (const line of text.split("\n")) {
    if (!line.startsWith("data: ")) continue;
    try {
      const json = JSON.parse(line.slice(6));
      if (json.type === "message_start") {
        model = json.message?.model ?? model;
        inputTokens = json.message?.usage?.input_tokens ?? 0;
      } else if (json.type === "message_delta") {
        outputTokens = json.usage?.output_tokens ?? 0;
      }
    } catch {
      // skip malformed lines
    }
  }
  return { model, inputTokens, outputTokens };
}

function shouldTrack(path: string[]): boolean {
  return path.at(-1) === "messages";
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

  const body = await request.arrayBuffer();
  const upstreamRes = await fetch(upstreamUrl, {
    method: "POST",
    headers: forwardHeaders(request),
    body,
  });

  const resHeaders = cleanResponseHeaders(upstreamRes.headers);

  // Non-tracked endpoints or errors — forward as-is
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
              const { model, inputTokens, outputTokens } = parseStreamUsage(accumulated);
              if (inputTokens > 0 || outputTokens > 0) {
                addProxyLog(ServiceType.Anthropic, model, inputTokens, outputTokens);
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
  const model = data.model ?? "unknown";
  const inputTokens = data.usage?.input_tokens ?? 0;
  const outputTokens = data.usage?.output_tokens ?? 0;
  if (inputTokens > 0 || outputTokens > 0) {
    addProxyLog(ServiceType.Anthropic, model, inputTokens, outputTokens);
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

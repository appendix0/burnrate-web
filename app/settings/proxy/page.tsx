"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Service = "anthropic" | "openai" | "gemini";
type Lang = "python" | "typescript";

function getSnippets(origin: string): Record<Service, Record<Lang, string>> {
  return {
    anthropic: {
      python: `import anthropic

client = anthropic.Anthropic(
    api_key="your-api-key",
    base_url="${origin}/api/proxy/anthropic",
)

# Use exactly as before — BurnRate tracks usage automatically
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello!"}],
)`,
      typescript: `import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: "your-api-key",
  baseURL: "${origin}/api/proxy/anthropic",
});

// Use exactly as before — BurnRate tracks usage automatically
const response = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello!" }],
});`,
    },
    openai: {
      python: `from openai import OpenAI

client = OpenAI(
    api_key="your-api-key",
    base_url="${origin}/api/proxy/openai/v1",
)

# Use exactly as before — BurnRate tracks usage automatically
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}],
)`,
      typescript: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "your-api-key",
  baseURL: "${origin}/api/proxy/openai/v1",
});

// Use exactly as before — BurnRate tracks usage automatically
const response = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello!" }],
});`,
    },
    gemini: {
      python: `import google.generativeai as genai
import google.api_core.client_options as client_options_lib

genai.configure(
    api_key="your-api-key",
    client_options=client_options_lib.ClientOptions(
        api_endpoint="${origin}/api/proxy/gemini",
    ),
)

# Use exactly as before — BurnRate tracks usage automatically
model = genai.GenerativeModel("gemini-1.5-flash")
response = model.generate_content("Hello!")`,
      typescript: `import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("your-api-key");

// Override the base URL via fetch interceptor or set GOOGLE_API_BASE_URL env:
// GOOGLE_API_BASE_URL=${origin}/api/proxy/gemini

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const result = await model.generateContent("Hello!");`,
    },
  };
}

const SERVICE_LABELS: Record<Service, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  gemini: "Gemini",
};

const SERVICE_COLORS: Record<Service, string> = {
  anthropic: "#d97706",
  openai: "#10b981",
  gemini: "#3b82f6",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="text-xs px-2.5 py-1 rounded border border-border bg-card hover:bg-accent transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative">
      <div className="absolute top-2.5 right-2.5">
        <CopyButton text={code} />
      </div>
      <pre className="bg-muted/40 border border-border rounded-lg p-4 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

export default function ProxySetupPage() {
  const router = useRouter();
  const [origin, setOrigin] = useState("http://localhost:3000");
  const [activeService, setActiveService] = useState<Service>("anthropic");
  const [activeLang, setActiveLang] = useState<Lang>("python");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const snippets = getSnippets(origin);
  const proxyUrl = `${origin}/api/proxy/${activeService}`;

  return (
    <main className="min-h-screen p-6 pb-24">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push("/settings")}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          ← Settings
        </button>

        <h1 className="text-xl font-semibold mb-1">Proxy Setup</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Route your API calls through BurnRate to track usage automatically.
          Your API key stays in your code — nothing changes except the base URL.
        </p>

        {/* How it works */}
        <div className="rounded-lg border border-border bg-card p-5 mb-8">
          <p className="text-sm font-medium mb-3">How it works</p>
          <div className="flex flex-col gap-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-burn/20 text-burn flex items-center justify-center font-bold flex-shrink-0 mt-0.5">1</span>
              <span>Copy the proxy URL for your service below.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-burn/20 text-burn flex items-center justify-center font-bold flex-shrink-0 mt-0.5">2</span>
              <span>Change the <code className="font-mono bg-muted px-1 rounded">base_url</code> / <code className="font-mono bg-muted px-1 rounded">baseURL</code> in your SDK config. That&apos;s the only code change.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-burn/20 text-burn flex items-center justify-center font-bold flex-shrink-0 mt-0.5">3</span>
              <span>Every API call now flows through BurnRate. It reads the token count from each response, calculates cost, and logs it — then passes the response to your app unchanged.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-burn/20 text-burn flex items-center justify-center font-bold flex-shrink-0 mt-0.5">4</span>
              <span>Refresh the dashboard to see your spend update in real time.</span>
            </div>
          </div>
        </div>

        {/* Service tabs */}
        <div className="flex gap-2 mb-6">
          {(["anthropic", "openai", "gemini"] as Service[]).map((s) => (
            <button
              key={s}
              onClick={() => setActiveService(s)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                activeService === s
                  ? "border-burn/50 bg-burn/10 font-medium"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{
                  backgroundColor: SERVICE_COLORS[s] + "33",
                  color: SERVICE_COLORS[s],
                }}
              >
                {SERVICE_LABELS[s][0]}
              </span>
              {SERVICE_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Proxy URL */}
        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
            Proxy base URL
          </p>
          <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-lg px-3 py-2.5">
            <code className="text-sm font-mono flex-1 break-all">{proxyUrl}</code>
            <CopyButton text={proxyUrl} />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            This URL is specific to your running BurnRate instance.
          </p>
        </div>

        {/* Language tabs */}
        <div className="flex gap-2 mb-3">
          {(["python", "typescript"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setActiveLang(l)}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                activeLang === l
                  ? "bg-foreground text-background font-medium"
                  : "border border-border bg-card hover:bg-accent"
              }`}
            >
              {l === "python" ? "Python" : "TypeScript / JS"}
            </button>
          ))}
        </div>

        {/* Code snippet */}
        <CodeBlock code={snippets[activeService][activeLang]} />

        {/* Notes */}
        <div className="mt-6 flex flex-col gap-2 text-xs text-muted-foreground">
          <p>
            <strong className="text-foreground">Historical data:</strong> Tracking starts from the moment
            the proxy is set up. Spend before that shows as $0.00 — that&apos;s expected.
          </p>
          <p>
            <strong className="text-foreground">Streaming:</strong> Fully supported. The proxy forwards
            chunks in real time and reads the usage summary from the final chunk.
          </p>
          <p>
            <strong className="text-foreground">Your API key:</strong> Stays in your code and is only
            ever sent to the provider (never stored by BurnRate).
          </p>
        </div>
      </div>
    </main>
  );
}

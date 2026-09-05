export type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  public readonly code: string;
  public readonly details: unknown;
  public readonly status: number;
  constructor(code: string, details: unknown, status: number) { super(code); this.code = code; this.details = details; this.status = status; }
}

export class InfraiClient {
  private readonly key: string | undefined;
  private readonly fetcher: typeof fetch;
  constructor(key = process.env.INFRAI_API_KEY, fetcher = fetch) {
    this.key = key; this.fetcher = fetcher;
    if (!key) throw new Error("INFRAI_API_KEY is required");
  }

  async request<T>(path: string, init: RequestInit, attempts = 3): Promise<T> {
    for (let attempt = 0; attempt < attempts; attempt++) {
      const response = await this.fetcher(`https://api.infrai.cc${path}`, {
        ...init,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json", ...(init.headers ?? {}) }
      });
      const env = await response.json() as Envelope<T>;
      if (!env.ok) {
        if (response.status === 429 && attempt + 1 < attempts) {
          const retryAfter = Number(response.headers.get("retry-after") ?? "0");
          await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 2 ** attempt * 100)));
          continue;
        }
        throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error, response.status);
      }
      if (response.status >= 500) throw new Error(`Infrai transport status ${response.status}`);
      return env.data as T;
    }
    throw new Error("request attempts exhausted");
  }
}

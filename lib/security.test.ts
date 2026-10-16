import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { checkOrigin, rateLimit } from "@/lib/security";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("permite requisições dentro do limite e nega a que excede", () => {
    const key = `test:${crypto.randomUUID()}`;

    for (let i = 0; i < 3; i++) {
      const r = rateLimit({ key, limit: 3, windowSec: 60 });
      expect(r.ok).toBe(true);
    }

    const blocked = rateLimit({ key, limit: 3, windowSec: 60 });
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("decrementa 'remaining' a cada chamada bem-sucedida", () => {
    const key = `test:${crypto.randomUUID()}`;

    const first = rateLimit({ key, limit: 5, windowSec: 60 });
    expect(first.remaining).toBe(4);

    const second = rateLimit({ key, limit: 5, windowSec: 60 });
    expect(second.remaining).toBe(3);
  });

  it("libera novamente depois que a janela expira", () => {
    const key = `test:${crypto.randomUUID()}`;

    rateLimit({ key, limit: 1, windowSec: 10 });
    const blocked = rateLimit({ key, limit: 1, windowSec: 10 });
    expect(blocked.ok).toBe(false);

    vi.advanceTimersByTime(10_001);

    const afterWindow = rateLimit({ key, limit: 1, windowSec: 10 });
    expect(afterWindow.ok).toBe(true);
  });

  it("mantém buckets independentes por chave", () => {
    const keyA = `test:${crypto.randomUUID()}`;
    const keyB = `test:${crypto.randomUUID()}`;

    rateLimit({ key: keyA, limit: 1, windowSec: 60 });
    const blockedA = rateLimit({ key: keyA, limit: 1, windowSec: 60 });
    const okB = rateLimit({ key: keyB, limit: 1, windowSec: 60 });

    expect(blockedA.ok).toBe(false);
    expect(okB.ok).toBe(true);
  });
});

describe("checkOrigin", () => {
  const req = (origin: string) => new Request("https://x.test/api", { method: "POST", headers: { origin } });

  afterEach(() => vi.unstubAllEnvs());

  it("aceita o site oficial e recusa outro domínio", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://tcc-emacrescere.vercel.app");
    expect(checkOrigin(req("https://tcc-emacrescere.vercel.app"))).toBeNull();
    expect(checkOrigin(req("https://outro-site.com"))?.status).toBe(403);
  });

  it("aceita o endereço da prévia da Vercel (deploy e branch)", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://tcc-emacrescere.vercel.app");
    vi.stubEnv("VERCEL_URL", "tcc-emacrescere-abc123.vercel.app");
    vi.stubEnv("VERCEL_BRANCH_URL", "tcc-emacrescere-git-pacotes-out26.vercel.app");
    expect(checkOrigin(req("https://tcc-emacrescere-abc123.vercel.app"))).toBeNull();
    expect(checkOrigin(req("https://tcc-emacrescere-git-pacotes-out26.vercel.app"))).toBeNull();
    expect(checkOrigin(req("https://tcc-emacrescere-outra.vercel.app"))?.status).toBe(403);
  });
});

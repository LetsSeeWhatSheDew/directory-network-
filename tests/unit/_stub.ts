// Test helper: replace global fetch with a tiny in-memory PostgREST-ish stub.
// Handlers match on the REST table name; every call is recorded.
export type Call = { method: string; table: string; url: URL; body: unknown };
type Handler = (c: Call) => unknown;

export function stubFetch(handlers: Record<string, Handler>): { calls: Call[]; restore: () => void } {
  const orig = globalThis.fetch;
  const calls: Call[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const table = url.pathname.replace(/^\/rest\/v1\//, "");
    const method = (init?.method || "GET").toUpperCase();
    let body: unknown = null;
    if (typeof init?.body === "string") {
      try { body = JSON.parse(init.body); } catch { body = init.body; }
    }
    const call = { method, table, url, body };
    calls.push(call);
    const h = handlers[table];
    if (!h) return new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });
    const out = h(call);
    if (out instanceof Response) return out;
    return new Response(JSON.stringify(out ?? []), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  return { calls, restore: () => { globalThis.fetch = orig; } };
}

/** A stand-in for the Resend client: records every send. */
export function fakeResend(fail = false) {
  const sent: Array<{ to: string; subject: string; html: string; text: string; key?: string }> = [];
  return {
    sent,
    client: {
      emails: {
        send: async (m: { to: string; subject: string; html: string; text: string }, o?: { idempotencyKey?: string }) => {
          if (fail) return { data: null, error: { message: "boom" } };
          sent.push({ ...m, key: o?.idempotencyKey });
          return { data: { id: "x" }, error: null };
        },
      },
    },
  };
}

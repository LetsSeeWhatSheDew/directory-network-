// IndexNow: tells Bing (which feeds Copilot and other AI search) and the
// other IndexNow engines which URLs changed, instead of waiting to be
// re-crawled. The key file lives at /public/<KEY>.txt.
export const INDEXNOW_KEY = "c71db1968a3e1c18d28bdeb3af191fb8";

export async function submitIndexNow(host: string, urls: string[]): Promise<{ status: number; count: number }> {
  const list = [...new Set(urls)].slice(0, 10000);
  if (list.length === 0) return { status: 0, count: 0 };
  const r = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `https://${host}/${INDEXNOW_KEY}.txt`, urlList: list }),
  });
  return { status: r.status, count: list.length };
}

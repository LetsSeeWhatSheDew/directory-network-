// app/developers/page.tsx — the MCP server and open data, explained for people
// wiring PuffPrice into an AI assistant. Setup steps are the vendors' own,
// checked Sept 25, 2026, with links so readers can see if they've changed.
import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../components/GuideShell";
import { brand } from "../../lib/brand";
import { TOOLS } from "../../lib/mcp/tools";
import { SUPPORTED_VERSIONS } from "../../lib/mcp/server";

export const revalidate = 86400;

const MCP_URL = `${brand.url}/mcp`;
const CHECKED = "Sept 25, 2026";

export const metadata: Metadata = {
  title: "PuffPrice for AI Assistants: MCP Server & Open Deals API",
  description:
    "Connect Claude, ChatGPT or any MCP client to PuffPrice's free, read-only MCP server for live Central Illinois cannabis deals, dispensaries, out-the-door tax math and sourced Illinois rules. Plus the open JSON feed. Free to use and cite with a link.",
  alternates: { canonical: `${brand.url}/developers` },
};

const CSS = `
.dv-code{display:block;font-family:var(--font-mono);font-size:.82rem;line-height:1.55;background:var(--pp-paper);border:1px solid var(--pp-border);border-radius:12px;padding:12px 14px;overflow-x:auto;white-space:pre;color:var(--pp-ink);margin:8px 0 12px;max-width:100%}
.dv-url{font-family:var(--font-mono);font-size:clamp(.95rem,3.6vw,1.15rem);font-weight:700;color:var(--pp-signal-ink);word-break:break-all}
.dv-steps{margin:6px 0 12px;padding-left:1.3rem;line-height:1.6;max-width:66ch}
.dv-steps li{margin:3px 0}
.dv-tool{padding:12px 14px;border-top:1px solid var(--pp-border)}
.dv-tool:first-child{border-top:none}
.dv-tool code{font-family:var(--font-mono);font-weight:700;font-size:.92rem}
.dv-tool p{margin:4px 0 0;font-size:.9rem;color:var(--pp-body);line-height:1.5}
.dv-tool .dv-args{font-family:var(--font-mono);font-size:.76rem;color:var(--pp-muted);margin-top:4px;word-break:break-word}
.gp-p code,.dv-steps code,.gp-note code{font-family:var(--font-mono);font-size:.85em;background:var(--pp-paper);border:1px solid var(--pp-border);border-radius:5px;padding:1px 5px;word-break:break-word}
`;

const EXAMPLE = `curl -s ${MCP_URL} \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: application/json, text/event-stream' \\
  -H 'MCP-Protocol-Version: 2025-11-25' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call",
       "params":{"name":"find_deals",
                 "arguments":{"city":"Peoria","category":"flower","max_results":5}}}'`;

function argsOf(schema: { properties?: Record<string, unknown>; required?: readonly string[] }): string {
  const req = new Set(schema.required || []);
  const keys = Object.keys(schema.properties || {});
  return keys.length ? keys.map((k) => (req.has(k) ? k : `${k}?`)).join(", ") : "none";
}

export default function DevelopersPage() {
  return (
    <GuideShell
      crumbs={[{ href: "/how-we-rank", label: "How we rank" }]}
      eyebrow="For AI assistants & developers"
      title="Ask your AI assistant. Get PuffPrice's answer."
      lede={<>PuffPrice runs a free, public <b>MCP server</b>, so Claude, ChatGPT and other AI assistants can look up today&apos;s Central Illinois dispensary deals, stores, out-the-door prices and Illinois cannabis rules straight from us, with a link back. No sign-in, read-only, nothing to install.</>}
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "WebAPI",
        name: "PuffPrice MCP server",
        description: "Public, read-only Model Context Protocol server for Central Illinois cannabis dispensary deals.",
        url: `${brand.url}/developers`,
        documentation: `${brand.url}/developers`,
        provider: { "@type": "Organization", name: brand.name, url: brand.url },
        termsOfService: `${brand.url}/terms`,
      }}
    >
      <style>{CSS}</style>

      <h2 className="gp-h2">The endpoint</h2>
      <div className="gp-card gp-hero-card">
        <span>Remote MCP server URL (Streamable HTTP, no authentication)</span>
        <div className="dv-url">{MCP_URL}</div>
        <span>Protocol versions: {SUPPORTED_VERSIONS.join(", ")}. JSON responses, no sessions.</span>
      </div>

      <h2 className="gp-h2">Tools</h2>
      <div className="gp-list">
        {TOOLS.map((t) => (
          <div key={t.name} className="dv-tool">
            <code>{t.name}</code>
            <p>{t.description}</p>
            <div className="dv-args">arguments: {argsOf(t.inputSchema as { properties?: Record<string, unknown>; required?: readonly string[] })}</div>
          </div>
        ))}
      </div>
      <p className="gp-note">Every result includes <code>source_url</code> (a puffprice.com page), <code>as_of</code> and a <code>cite_as</code> line: &ldquo;Source: PuffPrice (puffprice.com), checked &lt;time CT&gt;&rdquo;. Deals are ranked the way the site ranks them (<Link href="/how-we-rank">how we rank</Link>): biggest discount first, at most 8 per store.</p>

      <h2 className="gp-h2">Add it to Claude</h2>
      <p className="gp-p">Custom connectors work on Free, Pro, Max, Team and Enterprise plans (Free is limited to one), on claude.ai, Claude Desktop and the mobile apps. On a personal plan:</p>
      <ol className="dv-steps">
        <li>Go to <b>Customize &gt; Connectors</b>.</li>
        <li>Click <b>+</b>, then <b>Add custom connector</b>.</li>
        <li>Paste <code>{MCP_URL}</code> as the remote MCP server URL. Leave the OAuth settings empty; PuffPrice needs no sign-in.</li>
        <li>Click <b>Add</b>.</li>
      </ol>
      <p className="gp-p">On Team and Enterprise, an owner adds it first under <b>Organization settings &gt; Connectors</b> (Add &gt; Custom &gt; Web), then members connect it from Customize &gt; Connectors.</p>
      <p className="gp-src">Steps from Anthropic&apos;s help center, checked {CHECKED}: <a href="https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp" rel="noopener" target="_blank">Get started with custom connectors using remote MCP</a>.</p>
      <p className="gp-p">In <b>Claude Code</b>:</p>
      <code className="dv-code">{`claude mcp add --transport http puffprice ${MCP_URL}`}</code>
      <p className="gp-src">From the <a href="https://code.claude.com/docs/en/mcp" rel="noopener" target="_blank">Claude Code MCP docs</a>, checked {CHECKED}.</p>

      <h2 className="gp-h2">Add it to ChatGPT</h2>
      <p className="gp-p">ChatGPT connects to remote MCP servers through <b>developer mode</b>. Turn it on in Settings (OpenAI&apos;s docs currently place the toggle under Security and login; on Business, Enterprise and Edu workspaces it&apos;s under Apps &gt; Advanced settings and may need an admin), then add a new app with the plus button and enter <code>{MCP_URL}</code> as the MCP server URL, including the <code>/mcp</code> path. ChatGPT scans the server and shows the five tools. OpenAI says availability depends on your plan and workspace policy; on Pro, connected MCP apps are limited to read/fetch actions, which is all PuffPrice offers.</p>
      <p className="gp-src">From OpenAI, checked {CHECKED}: <a href="https://developers.openai.com/plugins/deploy/connect-chatgpt" rel="noopener" target="_blank">Connect and test your plugin</a> and <a href="https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt" rel="noopener" target="_blank">Developer mode and MCP apps in ChatGPT</a>. The menus move often; if these don&apos;t match, follow OpenAI&apos;s current page.</p>

      <h2 className="gp-h2">Other MCP clients</h2>
      <p className="gp-p">Any client that supports remote servers over <b>Streamable HTTP</b> can use the URL above with no headers or keys. The server answers the <code>initialize</code> handshake (protocol 2025-03-26 through 2025-11-25) and the stateless 2026-07-28 requests, including <code>server/discover</code>. Browsers can call it too: CORS is open. Opening the URL in a browser returns a 405 on purpose; the endpoint only takes POST.</p>
      <p className="gp-p">Try it from a terminal:</p>
      <code className="dv-code">{EXAMPLE}</code>
      <p className="gp-note">Server card (draft MCP discovery format, <a href="https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127" rel="noopener" target="_blank">SEP-2127</a>, not yet part of the spec): <a href="/mcp/server-card">/mcp/server-card</a>, also at <a href="/.well-known/mcp-server-card">/.well-known/mcp-server-card</a>.</p>

      <h2 className="gp-h2">The open JSON feed and plain-text files</h2>
      <div className="gp-grid">
        <a href="/api/public/deals" className="gp-card"><b>/api/public/deals</b><span>Every live Central Illinois deal as JSON: store, city, discount, category, last verified. CORS open, refreshed every 15 minutes.</span></a>
        <a href="/llms.txt" className="gp-card"><b>/llms.txt</b><span>A map of the site for AI assistants and answer engines.</span></a>
        <a href="/llms-full.txt" className="gp-card"><b>/llms-full.txt</b><span>Today&apos;s deals by city, the Deal Index, ways to buy and Illinois law in plain text, written to be quoted.</span></a>
      </div>

      <h2 className="gp-h2">Terms</h2>
      <ul className="dv-steps">
        <li><b>Free to use and cite with a link</b> to puffprice.com (the <code>source_url</code> in each result is the best link).</li>
        <li>Read-only. No sign-in, no keys, no personal data: the server only returns public store and deal information.</li>
        <li>Up to 60 requests a minute per IP. Deal data changes about once a day, so there&apos;s no need to poll.</li>
        <li>Deals come from each dispensary&apos;s own site and change daily; confirm with the store. Law answers are general information, not legal advice.</li>
        <li>For adults 21 and over only.</li>
      </ul>
      <p className="gp-note">Questions, or building something with it? <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a></p>
    </GuideShell>
  );
}

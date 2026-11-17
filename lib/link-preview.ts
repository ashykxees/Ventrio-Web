import { lookup as lookupCallback, type LookupAddress } from "node:dns";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { Agent, fetch } from "undici";

export type LinkPreview = {
  url: string;
  title: string;
  description: string;
  siteName: string;
  logoUrl: string;
  thumbnailUrl: string;
};

const MAX_HTML_BYTES = 512 * 1024;
const MAX_REDIRECTS = 4;
const TIMEOUT_MS = 6000;

// `fatal` errors reject the link; other failures fall back to a basic card.
export class PreviewError extends Error {
  fatal: boolean;

  constructor(message: string, fatal = false) {
    super(message);
    this.fatal = fatal;
  }
}

// Accepts "example.com" or a full link and returns a normalized http(s) URL, or null.
export function normalizeUrl(input: string): URL | null {
  const value = input.trim();

  if (!value || value.length > 500) {
    return null;
  }

  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`);

    if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".") || url.username || url.password) {
      return null;
    }

    url.hash = "";

    return url;
  } catch {
    return null;
  }
}

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19))
  );
}

export function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    return isPrivateIPv4(ip);
  }

  const lower = ip.toLowerCase();
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);

  if (mapped) {
    return isPrivateIPv4(mapped[1]);
  }

  return (
    lower === "::" ||
    lower === "::1" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe8") ||
    lower.startsWith("fe9") ||
    lower.startsWith("fea") ||
    lower.startsWith("feb") ||
    lower.startsWith("ff")
  );
}

// Blocks requests to localhost, private networks and cloud metadata addresses (SSRF).
async function assertPublicHost(url: URL) {
  if (!["http:", "https:"].includes(url.protocol) || (url.port && !["80", "443"].includes(url.port))) {
    throw new PreviewError("Only standard http and https links are supported.", true);
  }

  const host = url.hostname.replace(/^\[|\]$/g, "");

  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) {
    throw new PreviewError("That link points to a private address.", true);
  }

  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => []);

  if (addresses.length === 0) {
    throw new PreviewError("We couldn't find that website. Check the link and try again.", true);
  }

  if (addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new PreviewError("That link points to a private address.", true);
  }
}

async function readLimited(response: Awaited<ReturnType<typeof fetch>>): Promise<string> {
  const reader = response.body?.getReader();

  if (!reader) {
    return "";
  }

  const chunks: Uint8Array[] = [];
  let size = 0;

  while (size < MAX_HTML_BYTES) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
    size += value.byteLength;
  }

  await reader.cancel().catch(() => {});

  return new TextDecoder("utf-8", { fatal: false }).decode(Buffer.concat(chunks).subarray(0, MAX_HTML_BYTES));
}

// Re-checks the addresses the connection actually uses, so a DNS answer that changes after
// assertPublicHost (DNS rebinding) still can't reach a private address.
const publicOnlyAgent = new Agent({
  connect: {
    lookup(hostname, options, callback) {
      lookupCallback(hostname, { ...options, all: true }, (error, addresses: LookupAddress[]) => {
        if (error) {
          callback(error, "", 0);
          return;
        }

        if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
          callback(new PreviewError("That link points to a private address."), "", 0);
          return;
        }

        if (options.all) {
          (callback as unknown as (err: null, list: LookupAddress[]) => void)(null, addresses);
        } else {
          callback(null, addresses[0].address, addresses[0].family);
        }
      });
    },
  },
});

async function fetchHtml(start: URL): Promise<{ html: string; finalUrl: URL }> {
  let url = start;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    await assertPublicHost(url);

    const response = await fetch(url, {
      redirect: "manual",
      dispatcher: publicOnlyAgent,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; VentrioBot/1.0; +https://ventrio.org)",
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en-US,en;q=0.8",
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      await response.body?.cancel().catch(() => {});

      if (!location) {
        break;
      }

      url = new URL(location, url);
      continue;
    }

    if (!response.ok) {
      await response.body?.cancel().catch(() => {});
      throw new PreviewError(`The website responded with an error (${response.status}).`);
    }

    const type = response.headers.get("content-type") ?? "";

    if (type && !type.includes("html")) {
      await response.body?.cancel().catch(() => {});
      return { html: "", finalUrl: url };
    }

    return { html: await readLimited(response), finalUrl: url };
  }

  throw new PreviewError("That link redirects too many times.");
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const num = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(num) && num > 0 && num < 0x110000 ? String.fromCodePoint(num) : match;
    }

    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

function attributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};

  for (const match of tag.matchAll(/([a-zA-Z_:.-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g)) {
    attrs[match[1].toLowerCase()] = decodeEntities(match[3] ?? match[4] ?? match[5] ?? "").trim();
  }

  return attrs;
}

function clean(value: string | undefined, max: number): string {
  const text = (value ?? "").replace(/\s+/g, " ").trim();

  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

// Images are shown on our https site, so only absolute https image links are kept.
function imageUrl(value: string | undefined, base: URL): string {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value, base);

    return url.protocol === "https:" && url.href.length <= 1000 ? url.href : "";
  } catch {
    return "";
  }
}

export function parsePreview(html: string, pageUrl: URL): Omit<LinkPreview, "url"> {
  const head = html.slice(0, html.search(/<\/head>/i) > 0 ? html.search(/<\/head>/i) : html.length);
  const meta: Record<string, string> = {};

  for (const [tag] of head.matchAll(/<meta\s[^>]*>/gi)) {
    const attrs = attributes(tag);
    const key = (attrs.property || attrs.name || attrs.itemprop || "").toLowerCase();

    if (key && attrs.content && !(key in meta)) {
      meta[key] = attrs.content;
    }
  }

  const icons: { href: string; score: number }[] = [];

  for (const [tag] of head.matchAll(/<link\s[^>]*>/gi)) {
    const attrs = attributes(tag);
    const rel = (attrs.rel ?? "").toLowerCase();

    if (!attrs.href || !rel.includes("icon")) {
      continue;
    }

    const size = Number((attrs.sizes ?? "").split("x")[0]) || 0;
    const score = (rel.includes("apple-touch-icon") ? 1000 : 0) + (attrs.href.endsWith(".svg") ? 500 : 0) + size;
    icons.push({ href: attrs.href, score });
  }

  icons.sort((a, b) => b.score - a.score);

  const title = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const host = pageUrl.hostname.replace(/^www\./, "");

  return {
    title: clean(decodeEntities(meta["og:title"] || meta["twitter:title"] || title || ""), 100) || host,
    description: clean(
      decodeEntities(meta["og:description"] || meta["twitter:description"] || meta.description || ""),
      200,
    ),
    siteName: clean(meta["og:site_name"] || meta["application-name"] || "", 60) || host,
    thumbnailUrl: imageUrl(
      meta["og:image:secure_url"] || meta["og:image"] || meta["og:image:url"] || meta["twitter:image"] || meta["twitter:image:src"],
      pageUrl,
    ),
    logoUrl: imageUrl(icons[0]?.href || "/favicon.ico", pageUrl),
  };
}

// Fetches a public web page server-side and extracts its title, description, thumbnail and logo.
// Never throws for unreadable pages: falls back to the hostname so the product can still be saved.
export async function fetchLinkPreview(input: URL): Promise<LinkPreview & { fetched: boolean }> {
  try {
    const { html, finalUrl } = await fetchHtml(input);

    return { url: input.href, ...parsePreview(html, finalUrl), fetched: html.length > 0 };
  } catch (error) {
    if (error instanceof PreviewError && error.fatal) {
      throw error;
    }

    if (!(error instanceof PreviewError)) {
      console.warn(`[products] Preview fetch failed for ${input.hostname}:`, (error as Error).message);
    }

    return { url: input.href, ...parsePreview("", input), fetched: false };
  }
}

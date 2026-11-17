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
const MAX_IMAGE_CANDIDATES = 5;
const IMAGE_TIMEOUT_MS = 3000;
const USER_AGENT = "Mozilla/5.0 (compatible; VentrioBot/1.0; +https://ventrio.org)";
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
        "user-agent": USER_AGENT,
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

export type ParsedPreview = Omit<LinkPreview, "url"> & { thumbnailCandidates: string[]; logoCandidates: string[] };

export function parsePreview(html: string, pageUrl: URL): ParsedPreview {
  const headEnd = html.search(/<\/head>/i);
  const head = headEnd > 0 ? html.slice(0, headEnd) : html;
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
  const body = (headEnd > 0 ? html.slice(headEnd) : html).replace(/<!--[\s\S]*?-->/g, "");

  const thumbnailCandidates = unique(
    [
      meta["og:image:secure_url"],
      meta["og:image"],
      meta["og:image:url"],
      meta["twitter:image"],
      meta["twitter:image:src"],
      ...bodyImages(body),
    ].map((value) => imageUrl(value, pageUrl)),
  ).slice(0, MAX_IMAGE_CANDIDATES);

  const logoCandidates = unique(
    [...icons.map((icon) => icon.href), "/apple-touch-icon.png", "/favicon.ico"].map((value) => imageUrl(value, pageUrl)),
  ).slice(0, MAX_IMAGE_CANDIDATES);

  return {
    title: clean(decodeEntities(meta["og:title"] || meta["twitter:title"] || title || ""), 100) || host,
    description: clean(
      decodeEntities(meta["og:description"] || meta["twitter:description"] || meta.description || "") ||
        bodyDescription(body),
      200,
    ),
    siteName: clean(meta["og:site_name"] || meta["application-name"] || "", 60) || host,
    thumbnailUrl: thumbnailCandidates[0] ?? "",
    logoUrl: logoCandidates[0] ?? "",
    thumbnailCandidates,
    logoCandidates,
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

const SKIP_IMAGE = /(^data:|\.svg(\?|$)|logo|icon|sprite|pixel|spacer|badge|avatar|emoji)/i;

// Pages without Open Graph tags: use the first real photo on the page (img tags, inline
// background images, or image paths in inline scripts such as hero slideshows).
function bodyImages(body: string): string[] {
  const found: string[] = [];

  for (const [tag] of body.matchAll(/<img\s[^>]*>/gi)) {
    const attrs = attributes(tag);
    const src = attrs.src || attrs["data-src"] || attrs.srcset?.split(/\s+/)[0];
    const small = [attrs.width, attrs.height].some((size) => size && Number(size) > 0 && Number(size) < 120);

    if (src && !small && !SKIP_IMAGE.test(src)) {
      found.push(src);
    }
  }

  for (const match of body.matchAll(/url\(\s*['"]?([^'")$]+?\.(?:jpe?g|png|webp|gif)(?:\?[^'")]*)?)['"]?\s*\)/gi)) {
    found.push(match[1]);
  }

  for (const match of body.matchAll(/['"]((?:https?:)?\/?[\w./-]+\.(?:jpe?g|png|webp))['"]/gi)) {
    found.push(match[1]);
  }

  return found.filter((src) => !SKIP_IMAGE.test(src));
}

// Pages without a meta description: use the first sentence-length paragraph or heading.
function bodyDescription(body: string): string {
  const visible = body.replace(/<(script|style|noscript|svg|nav|header|footer)[\s>][\s\S]*?<\/\1>/gi, " ");

  for (const match of visible.matchAll(/<(p|h2|h3)[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const text = clean(decodeEntities(match[2].replace(/<[^>]+>/g, " ")).replace(/\s+([,.;:!?])/g, "$1"), 400);

    if (text.length >= 40 && !text.includes("{") && /[a-z]/i.test(text)) {
      return text;
    }
  }

  return "";
}

// Returns the first candidate that is actually an image, so cards never point at a 404
// or at an HTML page served in place of a missing favicon.
async function firstWorkingImage(candidates: string[]): Promise<string> {
  for (const candidate of candidates) {
    try {
      let url = new URL(candidate);

      for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
        // Redirects are followed by hand so every hop (including IP literals, which skip DNS) is checked.
        await assertPublicHost(url);

        const response = await fetch(url, {
          redirect: "manual",
          dispatcher: publicOnlyAgent,
          signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
          headers: { "user-agent": USER_AGENT, accept: "image/*" },
        });
        const type = response.headers.get("content-type") ?? "";
        const location = response.headers.get("location");
        await response.body?.cancel().catch(() => {});

        if (response.status >= 300 && response.status < 400 && location) {
          url = new URL(location, url);
          continue;
        }

        if (response.ok && type.startsWith("image/")) {
          return candidate;
        }

        break;
      }
    } catch {
      // Try the next candidate.
    }
  }

  return "";
}


// Fetches a public web page server-side and extracts its title, description, thumbnail and logo.
// Never throws for unreadable pages: falls back to the hostname so the product can still be saved.
export async function fetchLinkPreview(input: URL): Promise<LinkPreview & { fetched: boolean }> {
  try {
    const { html, finalUrl } = await fetchHtml(input);
    const { thumbnailCandidates, logoCandidates, ...preview } = parsePreview(html, finalUrl);
    const [thumbnailUrl, logoUrl] = await Promise.all([
      firstWorkingImage(thumbnailCandidates),
      firstWorkingImage(logoCandidates),
    ]);

    return { url: input.href, ...preview, thumbnailUrl, logoUrl, fetched: html.length > 0 };
  } catch (error) {
    if (error instanceof PreviewError && error.fatal) {
      throw error;
    }

    if (!(error instanceof PreviewError)) {
      console.warn(`[products] Preview fetch failed for ${input.hostname}:`, (error as Error).message);
    }

    const { title, description, siteName } = parsePreview("", input);

    return { url: input.href, title, description, siteName, thumbnailUrl: "", logoUrl: "", fetched: false };
  }
}

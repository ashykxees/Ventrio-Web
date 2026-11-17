import { test } from "node:test";
import assert from "node:assert/strict";
import { isPrivateAddress, normalizeUrl, parsePreview } from "./link-preview.ts";

test("normalizeUrl adds https and rejects non-web links", () => {
  assert.equal(normalizeUrl("ventrio.org/shop")?.href, "https://ventrio.org/shop");
  assert.equal(normalizeUrl("javascript:alert(1)"), null);
  assert.equal(normalizeUrl("ftp://example.com"), null);
  assert.equal(normalizeUrl("https://user:pw@example.com"), null);
  assert.equal(normalizeUrl("localhost"), null);
});

test("isPrivateAddress blocks internal ranges", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "172.20.0.1", "192.168.1.1", "169.254.169.254", "::1", "fd00::1", "::ffff:10.0.0.1"]) {
    assert.equal(isPrivateAddress(ip), true, ip);
  }
  assert.equal(isPrivateAddress("93.184.216.34"), false);
  assert.equal(isPrivateAddress("2606:4700::1111"), false);
});

test("parsePreview reads Open Graph tags, icons and falls back to the hostname", () => {
  const html = `<html><head><title>Fallback &amp; Title</title>
    <meta property="og:title" content="Acme &amp; Co">
    <meta name="description" content="We make   things.">
    <meta property="og:image" content="/og.png">
    <link rel="icon" href="/favicon-32.png" sizes="32x32">
    <link rel="apple-touch-icon" href="https://cdn.acme.com/apple.png">
    </head><body></body></html>`;
  const result = parsePreview(html, new URL("https://www.acme.com/page"));

  assert.equal(result.title, "Acme & Co");
  assert.equal(result.description, "We make things.");
  assert.equal(result.thumbnailUrl, "https://www.acme.com/og.png");
  assert.equal(result.logoUrl, "https://cdn.acme.com/apple.png");
  assert.equal(result.siteName, "acme.com");

  const empty = parsePreview("", new URL("http://shop.example.com"));
  assert.equal(empty.title, "shop.example.com");
  assert.equal(empty.logoUrl, "");
});

test("parsePreview falls back to page content when there are no meta tags", () => {
  const html = `<html><head><title>Holy Smokes BBQ</title></head><body>
    <header><a href="/"><img src="/logo.png" alt="logo"></a></header>
    <section><h1>Holy Smokes</h1><p>Short.</p>
    <p class="lead">Run by DC students learning <b>teamwork</b>, business, and the art of BBQ.</p></section>
    <script>const slides = ['/assets/hero1.jpg', '/assets/hero2.jpg'];</script>
    </body></html>`;
  const result = parsePreview(html, new URL("https://holysmokes.cc/"));

  assert.equal(result.description, "Run by DC students learning teamwork, business, and the art of BBQ.");
  assert.equal(result.thumbnailUrl, "https://holysmokes.cc/assets/hero1.jpg");
  assert.deepEqual(result.logoCandidates, ["https://holysmokes.cc/apple-touch-icon.png", "https://holysmokes.cc/favicon.ico"]);
});

test("parsePreview reads the body when </head> is omitted", () => {
  const result = parsePreview(
    `<title>Shop</title><p>Hand-made candles poured in small batches every week.</p><img src="/hero.jpg">`,
    new URL("https://candles.example.com/"),
  );

  assert.equal(result.description, "Hand-made candles poured in small batches every week.");
  assert.equal(result.thumbnailUrl, "https://candles.example.com/hero.jpg");
});

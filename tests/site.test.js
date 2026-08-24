import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

test("page declares a restrictive Content Security Policy", () => {
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /default-src 'none'/);
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /object-src 'none'/);
});

test("primary inputs have explicit labels and descriptions", () => {
  assert.match(html, /<label for="raw-input">/);
  assert.match(html, /<label for="approval-input">/);
  assert.match(html, /id="raw-help"/);
  assert.match(html, /id="approval-help"/);
});

test("page includes keyboard and announcement affordances", () => {
  assert.match(html, /class="skip-link"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /id="results-title" tabindex="-1"/);
});

test("tables include captions", () => {
  const tables = html.match(/<table>/g) ?? [];
  const captions = html.match(/<caption>/g) ?? [];
  assert.equal(tables.length, 2);
  assert.equal(captions.length, tables.length);
});

test("every button declares its type", () => {
  const buttons = html.match(/<button\b[^>]*>/g) ?? [];
  assert.ok(buttons.length >= 6);
  buttons.forEach((button) => assert.match(button, /\btype="(?:button|submit)"/));
});

test("application never injects user data through innerHTML", () => {
  assert.doesNotMatch(app, /\.innerHTML\b/);
  assert.match(app, /\.textContent\b/);
});

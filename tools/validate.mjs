#!/usr/bin/env node
// Static checks for the Clark Nova single-page PWA.
//
// The site ships as hand-written HTML/CSS/JS with no bundler, so this script is
// the whole "compile" stage. It parses every language in the page, then checks
// that everything the app points at actually exists:
//
//   1. HTML   - real HTML5 parse errors (parse5), unbalanced tags, duplicate ids
//   2. JS     - every inline <script> and every .js file (acorn)
//   3. JS     - every inline on* handler attribute
//   4. CSS    - every inline <style> block (css-tree)
//   5. JSON   - manifest.json
//   6. Refs   - href/src targets, audio/ files, sw.js precache list, start_url
//   7. Ids    - every getElementById('x') resolves to markup or a dynamic el.id
//
// Inline scripts are also written to .ci/extracted/ so the workflow can run
// `node --check` over them for a second opinion from V8 itself.
//
// Usage: node tools/validate.mjs [site-dir]

import {existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse as parseHtml} from 'parse5';
import * as acorn from 'acorn';
import {parse as parseCss} from 'css-tree';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.resolve(REPO, process.argv[2] || 'clarknova.nosocial.net');
const EXTRACT_DIR = path.join(REPO, '.ci', 'extracted');

const errors = [];
const warnings = [];
const rel = p => path.relative(REPO, p).split(path.sep).join('/');
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

// --- helpers ---------------------------------------------------------------

function walk(node, fn) {
  fn(node);
  for (const child of node.childNodes || []) walk(child, fn);
  if (node.content) walk(node.content, fn);
}
const attr = (node, name) => (node.attrs || []).find(a => a.name === name)?.value;
const textNodes = node => (node.childNodes || []).filter(c => c.nodeName === '#text');
const textOf = node => textNodes(node).map(c => c.value).join('');
// Line in index.html where an element's text content begins, so reported
// syntax errors point at the real file and not at the extracted snippet.
const contentLine = node => textNodes(node)[0]?.sourceCodeLocation?.startLine
  ?? node.sourceCodeLocation?.startTag?.endLine ?? 1;

function checkJs(code, where, lineOffset = 0) {
  try {
    acorn.parse(code, {ecmaVersion: 'latest', sourceType: 'script', locations: true});
    return true;
  } catch (e) {
    const line = (e.loc?.line ?? 0) + lineOffset;
    err(where, `JS syntax error at line ${line}, column ${e.loc?.column ?? '?'}: ${e.message.replace(/\s*\(\d+:\d+\)$/, '')}`);
    return false;
  }
}

// Local (non-external) reference that should resolve to a file on disk.
function isLocalRef(value) {
  if (!value) return false;
  return !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value);
}
const dec = s => { try { return decodeURIComponent(s); } catch { return s; } };
function resolveInSite(ref) {
  const clean = dec(ref.split('#')[0].split('?')[0]);
  if (!clean) return null;
  return path.join(SITE, clean.replace(/^\//, ''));
}

// --- 0. site directory -----------------------------------------------------

const indexPath = path.join(SITE, 'index.html');
if (!existsSync(indexPath)) {
  console.error(`FATAL: ${rel(indexPath)} not found`);
  process.exit(1);
}
const html = readFileSync(indexPath, 'utf8');

// --- 1. HTML ---------------------------------------------------------------

// HTML5 parse error codes to tolerate, if one ever turns out to be pedantic
// rather than a real defect. Empty on purpose: everything is a failure today.
const HTML_ERRORS_ALLOWED = new Set([]);

const parseErrors = [];
const doc = parseHtml(html, {
  sourceCodeLocationInfo: true,
  onParseError: e => parseErrors.push(e),
});
for (const e of parseErrors) {
  if (HTML_ERRORS_ALLOWED.has(e.code)) continue;
  err(rel(indexPath), `HTML parse error "${e.code}" at line ${e.startLine}, column ${e.startCol}`);
}

const ids = new Set();
const scripts = [];
const styles = [];
const handlers = [];
const localRefs = [];

walk(doc, node => {
  if (!node.tagName) return;
  const id = attr(node, 'id');
  if (id) {
    if (ids.has(id)) err(rel(indexPath), `duplicate id "${id}"`);
    ids.add(id);
  }
  for (const a of node.attrs || []) {
    if (/^on[a-z]+$/.test(a.name) && a.value.trim()) {
      handlers.push({node, name: a.name, code: a.value});
    }
    if ((a.name === 'href' || a.name === 'src') && isLocalRef(a.value)) {
      localRefs.push({node, name: a.name, value: a.value});
    }
  }
  if (node.tagName === 'script' && !attr(node, 'src')) {
    const code = textOf(node);
    if (code.trim()) scripts.push({code, line: contentLine(node)});
  }
  if (node.tagName === 'style') {
    const code = textOf(node);
    if (code.trim()) styles.push({code, line: contentLine(node)});
  }
});

if (!scripts.length) warn(rel(indexPath), 'no inline <script> found - is this the right file?');

// --- 2. inline JS + every .js file ----------------------------------------

rmSync(EXTRACT_DIR, {recursive: true, force: true});
mkdirSync(EXTRACT_DIR, {recursive: true});

scripts.forEach((s, i) => {
  const where = `${rel(indexPath)} <script #${i + 1}> (starts at line ${s.line})`;
  if (checkJs(s.code, where, s.line - 1)) {
    // Blank padding keeps line numbers aligned with index.html for `node --check`.
    const out = path.join(EXTRACT_DIR, `inline-script-${i + 1}.js`);
    writeFileSync(out, '\n'.repeat(Math.max(0, s.line - 1)) + s.code);
  }
});

const jsFiles = readdirSync(SITE).filter(f => f.endsWith('.js'));
if (!jsFiles.includes('sw.js')) warn(rel(SITE), 'no sw.js - the PWA will not work offline');
for (const f of jsFiles) {
  checkJs(readFileSync(path.join(SITE, f), 'utf8'), rel(path.join(SITE, f)));
}

// --- 3. inline event handlers ---------------------------------------------

for (const h of handlers) {
  const line = h.node.sourceCodeLocation?.attrs?.[h.name]?.startLine
    ?? h.node.sourceCodeLocation?.startLine ?? '?';
  // Wrapped so a bare `return` in a handler body stays legal.
  checkJs(`function __handler(event){\n${h.code}\n}`,
    `${rel(indexPath)} <${h.node.tagName} ${h.name}> at line ${line}`);
}

// --- 4. CSS ---------------------------------------------------------------

styles.forEach((s, i) => {
  const where = `${rel(indexPath)} <style #${i + 1}> (starts at line ${s.line})`;
  const report = e => err(where,
    `CSS syntax error at line ${(e.line ?? 1) + s.line - 1}, column ${e.column ?? '?'}: ${e.rawMessage || e.message}`);
  try {
    parseCss(s.code, {positions: true, onParseError: report});
  } catch (e) {
    report(e);
  }
});

// --- 5. manifest.json -----------------------------------------------------

let manifest = null;
const manifestPath = path.join(SITE, 'manifest.json');
if (existsSync(manifestPath)) {
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    err(rel(manifestPath), `invalid JSON: ${e.message}`);
  }
  if (manifest) {
    for (const key of ['name', 'start_url', 'icons']) {
      if (!(key in manifest)) err(rel(manifestPath), `missing required key "${key}"`);
    }
    if (isLocalRef(manifest.start_url) || manifest.start_url?.startsWith('/')) {
      const target = resolveInSite(manifest.start_url);
      if (target && !existsSync(target)) {
        err(rel(manifestPath), `start_url "${manifest.start_url}" does not exist in the bundle`);
      }
    }
    for (const icon of manifest.icons || []) {
      if (isLocalRef(icon.src)) {
        const target = resolveInSite(icon.src);
        if (target && !existsSync(target)) err(rel(manifestPath), `icon "${icon.src}" not found`);
      }
    }
  }
} else {
  warn(rel(SITE), 'no manifest.json - the app will not be installable');
}

// --- 6. references --------------------------------------------------------

for (const r of localRefs) {
  const target = resolveInSite(r.value);
  if (target && !existsSync(target)) {
    err(rel(indexPath), `<${r.node.tagName} ${r.name}="${r.value}"> points at a missing file`);
  }
}

const allJs = scripts.map(s => s.code).join('\n');

// audio/... paths referenced from the app code
// Filenames are percent-encoded in the source, e.g. audio/COMType_..%20Bell..wav
const audioRefs = new Set(allJs.match(/audio\/[A-Za-z0-9._%()~-]+/g) || []);
for (const ref of audioRefs) {
  const target = resolveInSite(ref);
  if (target && !existsSync(target)) err(rel(indexPath), `audio file missing: ${ref}`);
}

// service worker registration target
for (const reg of allJs.match(/serviceWorker\.register\(\s*'([^']+)'/g) || []) {
  const file = reg.match(/'([^']+)'/)[1];
  if (isLocalRef(file) && !existsSync(resolveInSite(file))) {
    err(rel(indexPath), `registers a service worker that is not in the bundle: ${file}`);
  }
}

// sw.js precache list
const swPath = path.join(SITE, 'sw.js');
if (existsSync(swPath)) {
  const sw = readFileSync(swPath, 'utf8');
  const cacheName = sw.match(/CACHE_NAME\s*=\s*['"]([^'"]+)['"]/)?.[1];
  if (!cacheName) {
    err(rel(swPath), 'no CACHE_NAME found - clients would never pick up a new release');
  } else if (!/^[A-Za-z0-9._-]+$/.test(cacheName)) {
    err(rel(swPath), `suspicious CACHE_NAME "${cacheName}"`);
  } else {
    console.log(`cache version: ${cacheName}`);
  }

  const assetsBlock = sw.match(/ASSETS\s*=\s*\[([\s\S]*?)\]/)?.[1] || '';
  const assets = [...assetsBlock.matchAll(/['"]([^'"]+)['"]/g)].map(m => m[1]);
  if (!assets.length) warn(rel(swPath), 'ASSETS list is empty');
  const precached = new Set();
  for (const a of assets) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(a)) continue;     // external (fonts)
    if (a === '/' || a === './') continue;             // navigation root
    const target = resolveInSite(a);
    if (target && !existsSync(target)) {
      err(rel(swPath), `precached asset is not in the bundle: ${a}`);
    }
    precached.add(dec(a.replace(/^\//, '')));
  }
  // Anything the app loads at runtime but never precaches breaks offline use.
  const audioDir = path.join(SITE, 'audio');
  if (existsSync(audioDir)) {
    for (const f of readdirSync(audioDir)) {
      if (!precached.has(`audio/${f}`)) {
        warn(rel(swPath), `audio/${f} is not in the sw.js precache list`);
      }
    }
  }
  for (const ref of audioRefs) {
    if (!precached.has(dec(ref))) {
      warn(rel(swPath), `${dec(ref)} is used by the app but not precached`);
    }
  }
}

// --- 7. getElementById targets -------------------------------------------

const dynamicIds = new Set([...allJs.matchAll(/\.id\s*=\s*['"]([^'"]+)['"]/g)].map(m => m[1]));
for (const m of allJs.matchAll(/getElementById\(\s*['"]([^'"]+)['"]\s*\)/g)) {
  const id = m[1];
  if (!ids.has(id) && !dynamicIds.has(id)) {
    err(rel(indexPath), `getElementById("${id}") has no matching element and is never created`);
  }
}
for (const h of handlers) {
  for (const m of h.code.matchAll(/getElementById\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    if (!ids.has(m[1]) && !dynamicIds.has(m[1])) {
      err(rel(indexPath), `inline ${h.name} references missing element id "${m[1]}"`);
    }
  }
}

// --- report ---------------------------------------------------------------

console.log(`checked ${rel(SITE)}: ${scripts.length} inline script(s), ${jsFiles.length} js file(s), ` +
  `${styles.length} style block(s), ${handlers.length} inline handler(s), ${ids.size} element id(s)`);

for (const w of warnings) console.log(`WARNING  ${w}`);
for (const e of errors) console.error(`ERROR    ${e}`);

if (errors.length) {
  console.error(`\n${errors.length} error(s) found.`);
  process.exit(1);
}
console.log(`\nOK - no errors${warnings.length ? `, ${warnings.length} warning(s)` : ''}.`);

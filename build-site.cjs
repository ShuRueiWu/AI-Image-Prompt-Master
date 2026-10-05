#!/usr/bin/env node
'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const esbuild = require('esbuild');
const parser = require('@babel/parser');

const ROOT = __dirname;
const SOURCE = path.join(ROOT, 'Prompts Builder V9.6.html');
const LOCAL_OUTPUT = path.join(ROOT, 'Prompt Master Offline.html');
const PUBLIC_OUTPUT = path.join(ROOT, 'index.html');
const IMAGE_MAP = path.join(ROOT, 'preset-previews/preset-image-map.js');
const ORIGINAL_MAP = path.join(ROOT, 'preset-previews/preset-originals-map.js');
const EMPTY_ORIGINAL_MAP = 'window.PRESET_ORIGINAL_MAP = Object.freeze({});';
const LICENSES = [
  ['React 18.2.0 (MIT)', path.join(ROOT, 'node_modules/react/LICENSE')],
  ['ReactDOM 18.2.0 (MIT)', path.join(ROOT, 'node_modules/react-dom/LICENSE')],
  ['Lucide React 0.292.0 (ISC)', path.join(ROOT, 'node_modules/lucide-react/LICENSE')],
  ['Tailwind CSS 3.4.19 (MIT)', path.join(ROOT, 'node_modules/tailwindcss/LICENSE')],
];

function collectClassSafelist(jsx) {
  const ast = parser.parse(jsx, { sourceType: 'module', plugins: ['jsx'] });
  const classes = new Set();
  const visit = node => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (node.type === 'JSXAttribute' && node.name?.name === 'className') {
      const collectStrings = value => {
        if (!value || typeof value !== 'object') return;
        if (Array.isArray(value)) return value.forEach(collectStrings);
        if (value.type === 'StringLiteral') {
          for (const token of value.value.split(/\s+/)) if (token) classes.add(token);
        } else if (value.type === 'TemplateElement') {
          for (const token of value.value.cooked.split(/\s+/)) if (token) classes.add(token);
        }
        for (const [key, child] of Object.entries(value)) {
          if (key !== 'loc' && key !== 'start' && key !== 'end' && key !== 'extra') collectStrings(child);
        }
      };
      collectStrings(node.value);
    }
    for (const [key, child] of Object.entries(node)) {
      if (key !== 'loc' && key !== 'start' && key !== 'end' && key !== 'extra') visit(child);
    }
  };
  visit(ast);
  return [...classes];
}

function extractJsx(html) {
  const match = html.match(/<script\s+type="text\/babel"\s+data-type="module">([\s\S]*?)<\/script>/i);
  if (!match) throw new Error('Canonical HTML has no Babel JSX module script.');
  const imports = [...match[1].matchAll(/^[ \t]*import\s+[\s\S]*?;/gm)].map(item => item[0].trim());
  const jsx = match[1].replace(/^[ \t]*import\s+[\s\S]*?;/gm, '');
  if (!imports.some(item => /from\s+['"]react['"]/.test(item)) || !imports.some(item => /from\s+['"]react-dom\/client['"]/.test(item)) || !imports.some(item => /from\s+['"]lucide-react['"]/.test(item))) {
    throw new Error('Canonical JSX entry is missing a required React or Lucide import.');
  }
  return { html: html.slice(0, match.index) + '__PROMPT_MASTER_BUNDLE__' + html.slice(match.index + match[0].length), jsx, imports };
}

function replaceOnce(source, pattern, replacement, label) {
  const next = source.replace(pattern, () => replacement);
  if (next === source) throw new Error(`Expected canonical markup not found: ${label}`);
  return next;
}

function replaceTextOnce(source, before, after, label) {
  const first = source.indexOf(before);
  if (first < 0 || source.indexOf(before, first + before.length) >= 0) throw new Error(`Expected one canonical JSX occurrence: ${label}`);
  return source.slice(0, first) + after + source.slice(first + before.length);
}

function transformJsx(jsx, mode) {
  let output = jsx;
  if (mode === 'public') {
    output = replaceTextOnce(output, 'const originals = window.PRESET_ORIGINAL_MAP?.[mapKey] || {};', 'const originals = {};', 'public original map access');
    output = replaceTextOnce(output, "title={originals[agent] ? tt('點擊查看原圖', 'Click to view original') : tt('點擊放大', 'Click to enlarge')}", "title={tt('預設圖參考', 'Preset reference')}", 'public thumbnail tooltip');
    output = replaceTextOnce(output, "onClick={e => { e.preventDefault(); e.stopPropagation(); setViewer({ src: originals[agent] || paths[agent], label, isOriginal: !!originals[agent] }); }}", '', 'public thumbnail click handler');
    output = replaceTextOnce(output, "className={`w-full ${compact ? 'h-24 sm:h-28' : 'h-28'} object-contain cursor-zoom-in`}", "className={`w-full ${compact ? 'h-24 sm:h-28' : 'h-28'} object-contain`}", 'public thumbnail cursor style');
  }
  output = replaceTextOnce(output,
    "{t('第三方元件於開啟頁面時從公開 CDN 載入，未內嵌、未修改：', 'Third-party components are loaded at runtime from public CDNs, not bundled or modified:')} Babel Standalone 7.29.9 (MIT), Tailwind CSS (MIT), React / ReactDOM 18.2.0 (MIT), Lucide 0.292.0 (ISC); {t('字型：', 'fonts: ')}Inter, Outfit, Noto Sans TC (SIL OFL 1.1, Google Fonts).",
    "{t('介面元件與樣式已隨檔案提供。版本與授權：React / ReactDOM 18.2.0 (MIT)、Tailwind CSS 3.4.19 (MIT)、Lucide 0.292.0 (ISC)；字型使用系統字型。', 'Interface components and styles are bundled. Versions and licenses: React / ReactDOM 18.2.0 (MIT), Tailwind CSS 3.4.19 (MIT), Lucide 0.292.0 (ISC); system fonts.')}",
    'bundled component license disclosure');
  output = replaceTextOnce(output,
    "{t('開啟頁面時瀏覽器會連線 Google Fonts、unpkg、esm.sh、cdn.tailwindcss.com；你輸入的提示詞不會被上傳，草稿只存在瀏覽器本機。', 'Opening the page connects your browser to Google Fonts, unpkg, esm.sh and cdn.tailwindcss.com; your prompts are never uploaded — drafts stay in your browser.')}",
    "{t('此版本不會連線載入外部元件或字型；你輸入的提示詞不會被上傳，草稿只存在瀏覽器本機。', 'This version does not load external components or fonts; prompts stay in your browser and are not uploaded.')}",
    'external connection disclosure');
  return output;
}

function embeddedScript(contents) {
  return `<script>\n${contents.replace(/<\/script/gi, '<\\/script')}\n</script>`;
}

function escapeHtmlComment(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/--/g, '&#45;&#45;');
}

async function bundledLicenseComment() {
  const entries = await Promise.all(LICENSES.map(async ([name, filename]) => {
    const text = await fs.readFile(filename, 'utf8');
    if (!text.trim()) throw new Error(`Empty license file: ${path.relative(ROOT, filename)}`);
    return `===== ${name} =====\n${text.trim()}`;
  }));
  return `<!-- Bundled runtime dependency licenses\n${escapeHtmlComment(entries.join('\n\n'))}\n-->`;
}

async function readOriginalMap(filename = ORIGINAL_MAP) {
  try {
    return await fs.readFile(filename, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return EMPTY_ORIGINAL_MAP;
    throw error;
  }
}

async function compileCss(html, jsx) {
  const safelist = collectClassSafelist(jsx);
  const config = {
    content: [{ raw: html, extension: 'html' }],
    darkMode: 'class',
    safelist,
    corePlugins: { preflight: true },
  };
  const result = await postcss([tailwindcss(config)]).process('@tailwind base;\n@tailwind components;\n@tailwind utilities;', { from: undefined });
  return { css: result.css, safelistCount: safelist.length };
}

async function compileJs(jsx) {
  const result = await esbuild.build({
    stdin: { contents: jsx, resolveDir: ROOT, sourcefile: 'prompt-master.jsx', loader: 'jsx' },
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    target: ['es2020'],
    jsx: 'automatic',
    minify: true,
    legalComments: 'inline',
    treeShaking: true,
    define: { 'process.env.NODE_ENV': '"production"' },
    logLevel: 'silent',
  });
  return result.outputFiles[0].text;
}

function cleanSourceHtml(html, mode, imageMap, originalMap, css, js, licenseComment) {
  let output = html;
  output = replaceOnce(output, /\s*<!-- Google Fonts -->\s*/, '\n', 'Google Fonts comment');
  output = replaceOnce(output, /\s*<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*/, '\n', 'Google Fonts preconnect');
  output = replaceOnce(output, /\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\s*/, '\n', 'Google Fonts asset preconnect');
  output = replaceOnce(output, /\s*<link\s+href="https:\/\/fonts\.googleapis\.com\/css2\?[\s\S]*?rel="stylesheet">\s*/, '\n', 'Google Fonts stylesheet');
  output = replaceOnce(output, /\s*<!-- Tailwind CSS -->\s*/, '\n', 'Tailwind CSS comment');
  output = replaceOnce(output, /\s*<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>\s*/, '\n', 'Tailwind CDN script');
  output = replaceOnce(output, /\s*<script>\s*tailwind\.config\s*=\s*\{[\s\S]*?\}\s*;?\s*<\/script>\s*/, '\n', 'Tailwind runtime config');
  output = replaceOnce(output, /\s*<!-- Babel for JSX -->\s*/, '\n', 'Babel comment');
  output = replaceOnce(output, /\s*<script src="https:\/\/unpkg\.com\/@babel\/standalone@[^\"]+"><\/script>\s*/, '\n', 'Babel runtime script');
  output = output.replace(/\s*<script type="importmap">[\s\S]*?<\/script>\s*/, '\n');

  output = replaceOnce(output, /<script src="\.\/preset-previews\/preset-image-map\.js"><\/script>/, embeddedScript(imageMap), 'thumbnail map script');
  if (mode === 'local') {
    output = replaceOnce(output, /<script>\s*\/\/ 只有本機[\s\S]*?<\/script>/, embeddedScript(originalMap), 'local original map loader');
  } else {
    output = replaceOnce(output, /<script>\s*\/\/ 只有本機[\s\S]*?<\/script>/, '', 'public original map loader');
  }

  output = output.replace("font-family: 'Inter', 'Noto Sans TC', sans-serif;", 'font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;');
  output = output.replace("font-family: 'Outfit', 'Noto Sans TC', sans-serif;", 'font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;');
  output = output.replace('<style>', `<style id="prompt-master-tailwind">\n${css}\n</style>\n    <style>`);
  output = replaceOnce(output, '<title>AI Image Prompt Master</title>', `<title>AI Image Prompt Master</title>\n    ${licenseComment}`, 'head license insertion point');

  output = output.replace('__PROMPT_MASTER_BUNDLE__', () => `<script>${js.replace(/<\/script/gi, '<\\/script')}</script>`);
  return output.replace(/[ \t]+(?=\r?$)/gm, '');
}

async function buildVariant(mode) {
  if (!['local', 'public'].includes(mode)) throw new Error(`Unknown build mode: ${mode}`);
  const html = await fs.readFile(SOURCE, 'utf8');
  const { html: shell, jsx: entryJsx, imports } = extractJsx(html);
  const jsx = transformJsx(`${imports.join('\n')}\n${entryJsx}`, mode);
  const [imageMap, originalMap, { css, safelistCount }, js, licenseComment] = await Promise.all([
    fs.readFile(IMAGE_MAP, 'utf8'),
    mode === 'local' ? readOriginalMap() : Promise.resolve(''),
    compileCss(shell, jsx),
    compileJs(jsx),
    bundledLicenseComment(),
  ]);
  const output = cleanSourceHtml(shell, mode, imageMap, originalMap, css, js, licenseComment);
  const runtimeResidues = [...output.matchAll(/__PROMPT_MASTER_BUNDLE__|text\/babel|importmap|cdn\.tailwindcss\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|esm\.sh|unpkg\.com/ig)].map(item => item[0]);
  if (runtimeResidues.length) throw new Error(`${mode} output still contains a runtime external dependency or uncompiled source marker: ${[...new Set(runtimeResidues)].join(', ')}`);
  if (mode === 'public' && /preset-originals-map|PRESET_ORIGINAL_MAP|preset-originals\//i.test(output)) {
    throw new Error('Public output still contains original-image map references.');
  }
  return { output, safelistCount, jsBytes: Buffer.byteLength(js), cssBytes: Buffer.byteLength(css) };
}

function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const targetFlag = args.find(arg => arg.startsWith('--target='));
  const target = targetFlag ? targetFlag.slice('--target='.length) : 'all';
  const outFlag = args.find(arg => arg.startsWith('--out='));
  const outPath = outFlag ? path.resolve(outFlag.slice('--out='.length)) : null;
  if (!['all', 'local', 'public'].includes(target)) throw new Error('--target must be all, local, or public.');
  if (outPath && target === 'all') throw new Error('--out requires --target=local or --target=public.');
  const outputs = [];
  for (const mode of target === 'all' ? ['local', 'public'] : [target]) {
    const result = await buildVariant(mode);
    const destination = outPath || (mode === 'local' ? LOCAL_OUTPUT : PUBLIC_OUTPUT);
    const previous = await fs.readFile(destination, 'utf8').catch(() => null);
    const changed = previous !== result.output;
    outputs.push({ mode, destination, changed, bytes: Buffer.byteLength(result.output), sha256: sha256(result.output), jsBytes: result.jsBytes, cssBytes: result.cssBytes, safelistCount: result.safelistCount });
    if (apply) await fs.writeFile(destination, result.output, 'utf8');
  }
  for (const item of outputs) {
    process.stdout.write(`${apply ? (item.changed ? 'WROTE' : 'CURRENT') : (item.changed ? 'WOULD WRITE' : 'CURRENT')} ${path.relative(ROOT, item.destination)} ${item.bytes} bytes sha256=${item.sha256} js=${item.jsBytes} css=${item.cssBytes} safelist=${item.safelistCount}\n`);
  }
  if (!apply) process.stdout.write('Dry run only. Pass --apply to write generated output.\n');
}

module.exports = { buildVariant, SOURCE, LOCAL_OUTPUT, PUBLIC_OUTPUT, ORIGINAL_MAP, readOriginalMap, sha256 };

if (require.main === module) {
  main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
}

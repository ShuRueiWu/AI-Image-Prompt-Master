// Audit every selectable style against built-in presets; optionally regenerate the coverage report.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, 'Prompts Builder V9.6.html'), 'utf8');
const data = vm.runInNewContext(html.slice(html.indexOf('        const configData ='), html.indexOf('        // Helper to find Chinese label')) + '; ({configData, BUILTIN_PRESETS})');
const presets = Object.values(data.BUILTIN_PRESETS).flatMap(Object.values);
const rows = Object.entries(data.configData.categories).flatMap(([category, styles]) => styles.map(style => ({
    category, style: style.label, value: style.val,
    presets: presets.filter(preset => (preset.styles || []).includes(style.val) || (preset.styles || []).includes(style.label)).map(preset => preset.name)
})));
const missing = rows.filter(row => !row.presets.length);
if (missing.length) { console.error(missing); process.exitCode = 1; }
else console.log(`PASS: ${rows.length}/${rows.length} styles covered by ${presets.length} built-in presets.`);
if (process.argv.includes('--report')) {
    const lines = ['# V9.6 Style Coverage', '', `${rows.length - missing.length}/${rows.length} selectable styles covered; ${presets.length} built-in presets.`, '', 'Data coverage only; no generated-image quality claims.', '', '| Category | Style | Example preset |', '|---|---|---|', ...rows.map(row => `| ${row.category} | ${row.style} | ${row.presets[0] || 'MISSING'} |`)];
    fs.writeFileSync(path.join(__dirname, 'STYLE_COVERAGE_V9.6.md'), lines.join('\n') + '\n');
}

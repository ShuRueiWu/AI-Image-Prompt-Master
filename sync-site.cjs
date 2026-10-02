/** Check the Pages entry against the canonical V9.6 HTML; --apply copies it. */
const fs = require('node:fs');
const path = require('node:path');
const source = path.join(__dirname, 'Prompts Builder V9.6.html');
const entry = path.join(__dirname, 'index.html');
const content = fs.readFileSync(source);
if (process.argv.includes('--apply')) fs.copyFileSync(source, entry);
if (!content.equals(fs.readFileSync(entry))) {
    console.error('index.html differs from V9.6. Run npm run sync:site to update it.');
    process.exitCode = 1;
} else console.log('PASS: index.html matches V9.6 byte for byte.');

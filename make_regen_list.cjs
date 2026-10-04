/**
 * Regenerate PRESET_IMAGES_REGEN_LIST.json from the current UI presets (no hand edits needed).
 * Reads "Prompts Builder V9.6.html" (BUILTIN_PRESETS), presets_prompts.json (old index/hash) and both
 * manifests, applies each preset through the real code path to get its copied prompt, and writes the list
 * of presets whose reference image must be (re)generated. Edit the `keys` array / regexes below to change
 * which presets are listed. Local only; run: node make_regen_list.cjs
 */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');const {chromium}=require('playwright');
const root=__dirname;const source=path.join(root,'Prompts Builder V9.6.html');
const html=fs.readFileSync(source,'utf8');
const presets=vm.runInNewContext(html.slice(html.indexOf('        const configData ='),html.indexOf('        // Helper to find Chinese label'))+'; BUILTIN_PRESETS');
const keys=['edu_poster','complex_magazine','layout_vogue_cover','port_fashion','layout_youtube_thumb','social_yt_thumb','lego_city','photo_film','ui_dashboard_dark','pedu_portrait','pedu_mechanism','starter_over_shoulder','starter_knolling','ai_avatar','ecommerce_lifestyle','layout_magazine_spread','layout_mag_cover','he_fb_handwash','style_example_2_85mm_lens','style_example_11_cottagecore','starter_double_exposure','style_example_9_taiwanese_glove_puppetry_style'];
const old=JSON.parse(fs.readFileSync(path.join(root,'presets_prompts.json'),'utf8'));
const oldBy=Object.fromEntries(old.map(p=>[p.group+'/'+p.key,p]));
const cm=JSON.parse(fs.readFileSync(path.join(root,'preset-previews/codex/manifest.json'),'utf8'));
const am=JSON.parse(fs.readFileSync(path.join(root,'preset-previews/agy/manifest.json'),'utf8'));
const targets=[];
for(const [g,grp] of Object.entries(presets))for(const [k,p] of Object.entries(grp)){
  if(keys.includes(k)||(k.startsWith('style_example')&&/finish line/.test(p.subject||''))||/^style_example_(8|10)_/.test(k)) targets.push([g,k,p]);
}
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});const pg=await b.newPage({viewport:{width:1440,height:1000}});
await pg.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async t=>{window.testPrompt=t;}}}));
await pg.goto(pathToFileURL(source).href);await pg.getByTestId('browse-presets').waitFor({timeout:60000});
const out=[];
for(const [g,k,p] of targets){
  await pg.getByTestId('browse-presets').click();await pg.getByPlaceholder('🔍 搜尋預設 (Search presets)...').fill(p.name);
  await pg.locator(`[data-preset-group=${JSON.stringify(g)}][data-preset-key="${k}"]`).click();
  await pg.getByRole('button',{name:/^(複製提示詞|已複製)$/}).click();
  const prompt=await pg.evaluate(()=>window.testPrompt);const id=g+'/'+k;const o=oldBy[id];
  out.push({group:g,key:k,name:p.name,index:o?.index,had_images:{codex:cm[id]?.status==='ok',agy:am[id]?.status==='ok'},
    old_prompt_sha256:o?.prompt_sha256,new_prompt_sha256:crypto.createHash('sha256').update(prompt).digest('hex'),new_prompt:prompt});
}
fs.writeFileSync(path.join(root,'PRESET_IMAGES_REGEN_LIST.json'),JSON.stringify(out,null,1));
console.log(out.length,'presets listed');
for(const o of out)console.log(o.index,o.key,JSON.stringify(o.had_images),o.old_prompt_sha256===o.new_prompt_sha256?'SAME-HASH?':'changed');
await b.close()})();

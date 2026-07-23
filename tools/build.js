/* ============================================================================
   Riposte Laboratories · multilingual static-site generator
   ----------------------------------------------------------------------------
   Emits every page in 13 languages (English + the 12 the Government of BC
   officially supports) across 4 renderings (full / mobile / lite / e-ink).

   Source of truth:
     tools/strings/en.js         English strings (one key = one unit)
     tools/strings/<lang>.json   translations (same keys; missing -> English)
     tools/assets/*              wordmark, diagrams, hero + deck scripts, deck css
     site.css                    full-site design      alt.css  lightweight design

   URL scheme (English at root, others under /<lang>/):
     full : /[seg/]            /<lang>/[seg/]
     alt  : /<variant>/[seg/]  /<lang>/<variant>/[seg/]
   Run:  node tools/build.js       (add --clean to remove generated dirs first)
   ============================================================================ */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const A = f => fs.readFileSync(path.join(__dirname, 'assets', f), 'utf8');

const WORDMARK = A('wordmark.svg');
const HEXUNIT = A('hexunit.svg');
const TESS = A('tessellation.svg');
const DOME = A('dome.svg');
const SIG_JS = A('sig.js');
const DECK_JS = A('deck.js');
const DECK_CSS = A('deck.css');

/* ---- languages (code = dir name; hreflang = BCP-47; dir = ltr|rtl) ---- */
const LANGS = [
  {code:'en',      hreflang:'en',      endo:'English',      en:'English',              dir:'ltr'},
  {code:'fr',      hreflang:'fr',      endo:'Français',endo2:'French',            en:'French',   dir:'ltr'},
  {code:'es',      hreflang:'es',      endo:'Español', en:'Spanish',              dir:'ltr'},
  {code:'zh-hans', hreflang:'zh-Hans', endo:'简体中文', en:'Chinese (Simplified)', dir:'ltr'},
  {code:'zh-hant', hreflang:'zh-Hant', endo:'繁體中文', en:'Chinese (Traditional)', dir:'ltr'},
  {code:'pa',      hreflang:'pa',      endo:'ਪੰਜਾਬੀ', en:'Punjabi', dir:'ltr'},
  {code:'ko',      hreflang:'ko',      endo:'한국어', en:'Korean',         dir:'ltr'},
  {code:'ja',      hreflang:'ja',      endo:'日本語', en:'Japanese',       dir:'ltr'},
  {code:'tl',      hreflang:'tl',      endo:'Tagalog',      en:'Tagalog',              dir:'ltr'},
  {code:'vi',      hreflang:'vi',      endo:'Tiếng Việt', en:'Vietnamese',   dir:'ltr'},
  {code:'hi',      hreflang:'hi',      endo:'हिन्दी', en:'Hindi', dir:'ltr'},
  {code:'ar',      hreflang:'ar',      endo:'العربية', en:'Arabic', dir:'rtl'},
  {code:'fa',      hreflang:'fa',      endo:'فارسی', en:'Farsi', dir:'rtl'},
];
const VARIANTS = ['full','mobile','lite','eink'];
const VCLASS = {mobile:'v-mobile', lite:'v-lite', eink:'v-eink'};
const PAGES = [
  {key:'home', seg:''},
  {key:'process', seg:'process'},
  {key:'recycling101', seg:'recycling101'},
  {key:'deck', seg:'deck'},
];

/* ---- string loading (translation falls back to English per key) ---- */
const EN = require('./strings/en.js');
function loadStrings(code){
  if(code === 'en') return EN;
  const p = path.join(__dirname, 'strings', code + '.json');
  let tr = {};
  if(fs.existsSync(p)){
    try{ tr = JSON.parse(fs.readFileSync(p,'utf8')); }
    catch(e){ console.warn('bad JSON for', code, e.message); }
  } else {
    console.warn('no translation file for', code, '(using English)');
  }
  return Object.assign({}, EN, tr);
}

/* ---- url helpers ---- */
function url(code, variant, pageKey){
  const seg = PAGES.find(p=>p.key===pageKey).seg;
  const parts = [];
  if(code !== 'en') parts.push(code);
  if(variant !== 'full') parts.push(variant);
  if(seg) parts.push(seg);
  return '/' + (parts.length ? parts.join('/') + '/' : '');
}
function outPath(code, variant, pageKey){
  const seg = PAGES.find(p=>p.key===pageKey).seg;
  const parts = [];
  if(code !== 'en') parts.push(code);
  if(variant !== 'full') parts.push(variant);
  if(seg) parts.push(seg);
  return path.join(ROOT, ...parts, 'index.html');
}

/* ============================================================================
   shared chrome
   ============================================================================ */
function langpick(t, code, variant, pageKey){
  const cur = LANGS.find(l=>l.code===code);
  const items = LANGS.map(l=>{
    const c = l.code===code ? ' aria-current="true"' : '';
    return `<a href="${url(l.code,variant,pageKey)}" hreflang="${l.hreflang}" lang="${l.hreflang}"${l.dir==='rtl'?' dir="rtl"':''}${c}>${l.endo}<span class="en">${l.en}</span></a>`;
  }).join('');
  return `<details class="langpick"><summary aria-label="${t['chrome.language']}"><span class="globe" aria-hidden="true">\u{1F310}</span> ${cur.endo} <span class="car" aria-hidden="true">▾</span></summary><div class="langmenu">${items}</div></details>`;
}
function vswitch(t, code, variant, pageKey){
  const V = [['full',t['chrome.full']],['mobile',t['chrome.mobile']],['lite',t['chrome.lite']],['eink',t['chrome.eink']]];
  const items = V.map(([v,label])=>{
    const c = v===variant ? ' aria-current="true"' : '';
    return `<a href="${url(code,v,pageKey)}"${c}>${label}</a>`;
  }).join('');
  return `<nav class="vswitch" aria-label="${t['chrome.version']}">${items}</nav>`;
}
function hreflangs(variant, pageKey){
  const links = LANGS.map(l=>`<link rel="alternate" hreflang="${l.hreflang}" href="${url(l.code,variant,pageKey)}">`);
  links.push(`<link rel="alternate" hreflang="x-default" href="${url('en',variant,pageKey)}">`);
  return links.join('\n');
}
function mtnote(t, code){
  return code==='en' ? '' : `<div class="mtnote">${t['chrome.mtnote']}</div>`;
}

/* ============================================================================
   shared block builders (identical markup for full + alt; classes exist in both)
   ============================================================================ */
function flow(t, steps){
  return `<div class="flow" aria-label="process">${steps.map(s=>
    `<div class="step"><b>${s.n}</b>${t[s.label]}<br><span class="dim">${t[s.sub]}</span></div>`).join('')}</div>`;
}
function verdictDuo(t, cols){
  return `<div class="duo">${cols.map(c=>
    `<div class="verdict ${c.kind}"><div class="v-h">${t[c.h]}</div><ul>${c.items.map(i=>`<li>${t[i]}</li>`).join('')}</ul></div>`).join('')}</div>`;
}
function codesGrid(t, items){
  return `<div class="codes">${items.map(i=>
    `<div class="code ${i.kind}"><span class="num">${i.n}</span><b>${i.name}</b><span>${t[i.desc]}</span></div>`).join('')}</div>`;
}
function rulesGrid(t, items){
  return `<div class="rules">${items.map(i=>
    `<div class="rule"><span class="r-n">${i.n}</span><b>${t[i.t]}</b><p>${t[i.d]}</p></div>`).join('')}</div>`;
}
function partnersGrid(t, items){
  return `<div class="partners">${items.map(i=>
    `<div class="partner"><span class="p-n">${i.n}</span><b>${t[i.name]}</b><p>${t[i.desc]}</p><div class="drops">${t[i.drops]}</div></div>`).join('')}</div>`;
}
function note(t, h, body, subst){
  let b = t[body];
  if(subst) for(const k in subst) b = b.replace('{'+k+'}', subst[k]);
  return `<div class="note"><b>${t[h]}</b>${b}</div>`;
}
function stamp(t, key){ return `<span class="stamp">${t[key]}</span>`; }
function pills(t, keys){ return `<div class="pills">${keys.map(k=>`<span class="pill">${t[k]}</span>`).join('')}</div>`; }
function fnlist(t, items){ return `<ol class="fnlist">${items.map((it,i)=>`<li id="fn${i+1}">${t[it]}</li>`).join('')}</ol>`; }

/* ============================================================================
   FULL renderers (site.css design)
   ============================================================================ */
function fSechead(sec, cno, h, tag){
  return `<div class="sechead ${cno}"><span class="no">${sec}</span><h2>${h}</h2><span class="tag">// ${tag}</span></div>`;
}
function fSpec(head, doc, variant, lis){
  return `<div class="spec ${variant||''}"><div class="spec-h"><span>${head}</span><span>${doc}</span></div>`+
    `<div class="spec-b"><ul>${lis.map(l=>`<li>${l}</li>`).join('')}</ul></div></div>`;
}
const MARQUEE = (()=>{
  const one = `<span class="c1">PARRY</span><span class="r">RIPOSTE</span><span class="c3">RECYCLE</span><span>REPEAT</span><span class="c2">♻</span>`;
  return `<div class="marquee" aria-hidden="true"><div class="track">${one.repeat(6)}</div></div>`;
})();

function fullHome(t){
  const S = k => t[k];
  return {
    scripts: `<script>${SIG_JS}</script>`,
    body: `
<div class="hero">
  <span class="corner tl">RIPOSTE LABORATORIES INC.</span>
  <span class="corner tr">EST. 2026</span>
  <span class="corner bl">DOC NO. RL-000-A</span>
  <span class="corner br">REV. A</span>
  <canvas id="sig" class="sig" aria-hidden="true"></canvas>
  <div class="inner">
    <div class="mark">${WORDMARK}</div>
    <div class="labname">L A B O R A T O R I E S &nbsp; I N C .</div>
    <h1><span class="p">${S('home.h1a')}</span> ${S('home.h1b')}</h1>
    <p class="sub">${S('home.sub')}</p>
    <a class="cta" href="#mission">${S('home.cta')} ↓</a>
  </div>
</div>
${MARQUEE}
<section class="sec" id="mission">
  ${fSechead('SEC.01','pinkno',S('home.mission.h'),S('home.mission.tag'))}
  <p class="lead">${S('home.mission.def')}</p>
  ${flow(t,[{n:'01',label:'flow.intake',sub:'flow.intake.sub'},{n:'02',label:'flow.parry',sub:'flow.parry.sub'},{n:'03',label:'flow.riposte',sub:'flow.riposte.sub'},{n:'04',label:'flow.return',sub:'flow.return.sub'}])}
  <p>${S('home.mission.p1')}</p>
  <p>${S('home.mission.p2')}</p>
</section>
<div class="checker"></div>
<section class="sec" id="plastics">
  ${fSechead('SEC.02','orangeno',S('home.plastics.h'),S('home.plastics.tag'))}
  <div class="cols">
    ${fSpec(S('home.plastics.spec.h'),'RL-P01','orangehead',[1,2,3,4,5].map(i=>S('home.plastics.spec.'+i)))}
    <div>
      <p class="lead">${S('home.plastics.lead')}</p>
      <p>${S('home.plastics.p1')}</p>
      <p class="dim">${S('home.plastics.p2')}</p>
    </div>
  </div>
</section>
<div class="harlequin"></div>
<section class="dark"><section class="sec" id="hex">
  ${fSechead('SEC.03','',S('home.hex.h'),S('home.hex.tag'))}
  <div class="cols">
    <div>
      <div class="hexwrap">${HEXUNIT}</div>
      ${fSpec(S('home.hex.spec.h'),'RL-H01','',[1,2,3,4,5,6,7,8].map(i=>S('home.hex.spec.'+i)))}
    </div>
    <div>
      <p class="lead">${S('home.hex.lead')}</p>
      <p>${S('home.hex.p1')}</p>
      <p>${S('home.hex.p2')}</p>
      <p>${S('home.hex.p3')}</p>
      <div class="hexwrap tess" aria-hidden="true">${TESS}</div>
      ${stamp(t,'home.hex.stamp')}
    </div>
  </div>
</section></section>
<section class="esh"><section class="sec" id="esh">
  ${fSechead('SEC.04','',S('home.esh.h'),S('home.esh.tag'))}
  <div class="mark">${WORDMARK}</div>
  <div class="cols">
    ${fSpec(S('home.esh.spec.h'),'RL-E01','',[1,2,3,4,5].map(i=>S('home.esh.spec.'+i)))}
    <div>
      <p class="lead">${S('home.esh.lead')}</p>
      <p>${S('home.esh.p1')}</p>
    </div>
  </div>
</section></section>
<section class="sec contact" id="contact">
  ${fSechead('SEC.05','tealno',S('home.contact.h'),S('home.contact.tag'))}
  <p class="lead">${S('home.contact.lead')}</p>
  <a class="bigmail" href="mailto:esh@ripostelabs.xyz">✉ esh@ripostelabs.xyz</a>
</section>
<section class="sec sources" id="sources">
  ${fSechead('REF','',S('sources.h'),S('sources.tag'))}
  ${fnlist(t,['src.statcan','src.apr','src.rcbc'])}
</section>
<div class="checker teal"></div>`
  };
}

function fullProcess(t){
  const S = k => t[k];
  const contact = url('en','full','home')+'#contact';
  return { body: `
<div class="pagehead">
  <div class="inner">
    <div class="kicker">${S('process.kicker')}</div>
    <h1>${S('process.h1')}</h1>
    <p>${S('process.intro')}</p>
  </div>
</div>
<div class="checker"></div>
<section class="sec">
  ${fSechead('SEC.01','pinkno',S('process.model.h'),S('process.model.tag'))}
  <div class="cols">
    ${fSpec(S('process.model.spec.h'),'RL-200','',[1,2,3,4,5].map(i=>S('process.model.spec.'+i)))}
    <div>
      <p class="lead">${S('process.model.lead')}</p>
      <p>${S('process.model.p1')}</p>
      <p>${S('process.model.p2')}</p>
    </div>
  </div>
  ${flow(t,[{n:'01',label:'flow.partner',sub:'flow.partner.sub'},{n:'02',label:'flow.collect',sub:'flow.collect.sub'},{n:'03',label:'flow.riposte',sub:'flow.riposte2.sub'},{n:'04',label:'flow.return',sub:'flow.return.sub'}])}
</section>
<div class="harlequin"></div>
<section class="sec">
  ${fSechead('SEC.02','orangeno',S('process.plastic.h'),S('process.plastic.tag'))}
  <div class="cols">
    ${fSpec(S('process.plastic.spec.h'),'RL-P02','orangehead',[1,2,3,4,5,6].map(i=>S('process.plastic.spec.'+i)))}
    <div>
      <p class="lead">${S('process.plastic.lead')}</p>
      <p>${S('process.plastic.p1')}</p>
      <p>${S('process.plastic.p2')}</p>
      <p class="dim">${S('process.plastic.p3')}</p>
    </div>
  </div>
</section>
<div class="checker teal"></div>
<section class="sec">
  ${fSechead('SEC.03','tealno',S('process.battery.h'),S('process.battery.tag'))}
  <div class="cols">
    ${fSpec(S('process.battery.spec.h'),'RL-H02','tealhead',[1,2,3,4,5,6,7].map(i=>S('process.battery.spec.'+i)))}
    <div>
      <p class="lead">${S('process.battery.lead')}</p>
      <p>${S('process.battery.p1')}</p>
      <p>${S('process.battery.p2')}</p>
      <p>${S('process.battery.p3')}</p>
      <p class="dim">${S('process.battery.p4')}</p>
      ${stamp(t,'process.battery.stamp')}
    </div>
  </div>
</section>
<div class="harlequin"></div>
<section class="sec">
  ${fSechead('SEC.04','pinkno',S('process.network.h'),S('process.network.tag'))}
  <p class="lead">${S('process.network.lead')}</p>
  ${partnersGrid(t,[
    {n:'TYPE 01',name:'process.network.p1.name',desc:'process.network.p1.desc',drops:'process.network.p1.drops'},
    {n:'TYPE 02',name:'process.network.p2.name',desc:'process.network.p2.desc',drops:'process.network.p2.drops'},
    {n:'TYPE 03',name:'process.network.p3.name',desc:'process.network.p3.desc',drops:'process.network.p3.drops'},
    {n:'TYPE 04',name:'process.network.p4.name',desc:'process.network.p4.desc',drops:'process.network.p4.drops'},
  ])}
  ${note(t,'process.network.note.h','process.network.note.body',{contact})}
</section>
<div class="checker"></div>
<section class="sec">
  ${fSechead('REF','tealno',S('sources.h'),S('sources.tag'))}
  ${fnlist(t,['src.apr2','src.rcbc2','src.tc','src.reg','src.fire'])}
</section>` };
}

function fullRecyc(t){
  const S = k => t[k];
  const contact = url('en','full','home')+'#contact';
  const toc = [
    ['basics','toc.basics'],['plastics','toc.plastics'],['paper','toc.paper'],['glass','toc.glass'],
    ['metal','toc.metal'],['batteries','toc.batteries'],['organics','toc.organics'],['textiles','toc.textiles'],
    ['rules','toc.rules'],['sources','toc.sources']
  ];
  const tocNums = ['01','02','03','04','05','06','07','08','09','REF'];
  const tocHtml = `<nav class="toc" id="toc" aria-label="Sections"><div class="toc-h">${S('recyc.toc.h')}</div>`+
    toc.map((x,i)=>`<a href="#${x[0]}"><span class="n">${tocNums[i]}</span>${S(x[1])}</a>`).join('')+`</nav>`;
  const mh = (sec,h,tag)=>`<div class="sechead"><span class="no">${sec}</span><h2>${h}</h2><span class="tag">// ${tag}</span></div>`;
  return { body: `
<div class="pagehead">
  <div class="inner">
    <div class="kicker">${S('recyc.kicker')}</div>
    <h1>${S('recyc.h1')}</h1>
    <p>${S('recyc.intro')}</p>
  </div>
</div>
<div class="checker"></div>
<div class="layout">
${tocHtml}
<div class="content">
  <section class="mat" id="basics">
    ${mh('SEC.01',S('recyc.basics.h'),S('recyc.basics.tag'))}
    <p class="lead">${S('recyc.basics.lead')}</p>
    <p>${S('recyc.basics.p1')}</p><p>${S('recyc.basics.p2')}</p><p>${S('recyc.basics.p3')}</p>
    ${note(t,'recyc.basics.note.h','recyc.basics.note.body')}
  </section>
  <section class="mat" id="plastics">
    ${mh('SEC.02',S('recyc.plastics.h'),S('recyc.plastics.tag'))}
    <p class="lead">${S('recyc.plastics.lead')}</p><p>${S('recyc.plastics.p1')}</p>
    ${codesGrid(t,[
      {n:'1',kind:'good',name:'PET',desc:'code.1'},{n:'2',kind:'good',name:'HDPE',desc:'code.2'},
      {n:'3',kind:'bad',name:'PVC',desc:'code.3'},{n:'4',kind:'some',name:'LDPE',desc:'code.4'},
      {n:'5',kind:'some',name:'PP',desc:'code.5'},{n:'6',kind:'bad',name:'PS',desc:'code.6'},
      {n:'7',kind:'bad',name:'Other',desc:'code.7'}])}
    ${verdictDuo(t,[
      {kind:'yes',h:'recyc.plastics.yes.h',items:['recyc.plastics.yes.1','recyc.plastics.yes.2','recyc.plastics.yes.3','recyc.plastics.yes.4']},
      {kind:'no',h:'recyc.plastics.no.h',items:['recyc.plastics.no.1','recyc.plastics.no.2','recyc.plastics.no.3','recyc.plastics.no.4']}])}
    ${note(t,'recyc.plastics.note.h','recyc.plastics.note.body')}
  </section>
  <section class="mat" id="paper">
    ${mh('SEC.03',S('recyc.paper.h'),S('recyc.paper.tag'))}
    <p class="lead">${S('recyc.paper.lead')}</p><p>${S('recyc.paper.p1')}</p>
    ${verdictDuo(t,[
      {kind:'yes',h:'recyc.paper.yes.h',items:['recyc.paper.yes.1','recyc.paper.yes.2','recyc.paper.yes.3','recyc.paper.yes.4']},
      {kind:'no',h:'recyc.paper.no.h',items:['recyc.paper.no.1','recyc.paper.no.2','recyc.paper.no.3','recyc.paper.no.4']}])}
  </section>
  <section class="mat" id="glass">
    ${mh('SEC.04',S('recyc.glass.h'),S('recyc.glass.tag'))}
    <p class="lead">${S('recyc.glass.lead')}</p><p>${S('recyc.glass.p1')}</p>
    ${verdictDuo(t,[
      {kind:'yes',h:'recyc.glass.yes.h',items:['recyc.glass.yes.1','recyc.glass.yes.2']},
      {kind:'no',h:'recyc.glass.no.h',items:['recyc.glass.no.1','recyc.glass.no.2','recyc.glass.no.3','recyc.glass.no.4']}])}
  </section>
  <section class="mat" id="metal">
    ${mh('SEC.05',S('recyc.metal.h'),S('recyc.metal.tag'))}
    <p class="lead">${S('recyc.metal.lead')}</p><p>${S('recyc.metal.p1')}</p>
    ${verdictDuo(t,[
      {kind:'yes',h:'recyc.metal.yes.h',items:['recyc.metal.yes.1','recyc.metal.yes.2','recyc.metal.yes.3','recyc.metal.yes.4']},
      {kind:'no',h:'recyc.metal.no.h',items:['recyc.metal.no.1','recyc.metal.no.2','recyc.metal.no.3']}])}
  </section>
  <section class="mat" id="batteries">
    ${mh('SEC.06',S('recyc.batteries.h'),S('recyc.batteries.tag'))}
    <p class="lead">${S('recyc.batteries.lead')}</p>
    <p>${S('recyc.batteries.p1')}</p><p>${S('recyc.batteries.p2')}</p><p>${S('recyc.batteries.p3')}</p>
    ${verdictDuo(t,[
      {kind:'warn',h:'recyc.batteries.warn.h',items:['recyc.batteries.warn.1','recyc.batteries.warn.2','recyc.batteries.warn.3','recyc.batteries.warn.4']},
      {kind:'no',h:'recyc.batteries.no.h',items:['recyc.batteries.no.1','recyc.batteries.no.2','recyc.batteries.no.3','recyc.batteries.no.4']}])}
    ${note(t,'recyc.batteries.note.h','recyc.batteries.note.body',{contact})}
  </section>
  <section class="mat" id="organics">
    ${mh('SEC.07',S('recyc.organics.h'),S('recyc.organics.tag'))}
    <p class="lead">${S('recyc.organics.lead')}</p><p>${S('recyc.organics.p1')}</p>
    ${verdictDuo(t,[
      {kind:'yes',h:'recyc.organics.yes.h',items:['recyc.organics.yes.1','recyc.organics.yes.2','recyc.organics.yes.3']},
      {kind:'no',h:'recyc.organics.no.h',items:['recyc.organics.no.1','recyc.organics.no.2','recyc.organics.no.3']}])}
  </section>
  <section class="mat" id="textiles">
    ${mh('SEC.08',S('recyc.textiles.h'),S('recyc.textiles.tag'))}
    <p class="lead">${S('recyc.textiles.lead')}</p><p>${S('recyc.textiles.p1')}</p>
    ${verdictDuo(t,[
      {kind:'yes',h:'recyc.textiles.yes.h',items:['recyc.textiles.yes.1','recyc.textiles.yes.2','recyc.textiles.yes.3']},
      {kind:'no',h:'recyc.textiles.no.h',items:['recyc.textiles.no.1','recyc.textiles.no.2']}])}
  </section>
  <section class="mat" id="rules">
    ${mh('SEC.09',S('recyc.rules.h'),S('recyc.rules.tag'))}
    <p class="lead">${S('recyc.rules.lead')}</p>
    ${rulesGrid(t,[
      {n:'01',t:'recyc.rules.1.t',d:'recyc.rules.1.d'},{n:'02',t:'recyc.rules.2.t',d:'recyc.rules.2.d'},
      {n:'03',t:'recyc.rules.3.t',d:'recyc.rules.3.d'},{n:'04',t:'recyc.rules.4.t',d:'recyc.rules.4.d'},
      {n:'05',t:'recyc.rules.5.t',d:'recyc.rules.5.d'}])}
  </section>
  <section class="mat" id="sources">
    ${mh('REF',S('sources.h'),S('sources.tag'))}
    <p class="lead">${S('recyc.sources.lead')}</p>
    ${fnlist(t,['src.statcan','src.rcbc3','src.fire','src.reg2'])}
  </section>
</div>
</div>` };
}

/* ---- deck (full = slide engine, self-contained) ---- */
function fullDeck(t){
  const S = k => t[k];
  const specUL = lis => `<ul>${lis.map(l=>`<li>${l}</li>`).join('')}</ul>`;
  const dfn = items => `<ol class="fnlist">${items.map((it,i)=>`<li id="fn${i+1}">${S(it)}</li>`).join('')}</ol>`;
  const kick = (chip,chipcls,h,tag)=>`<div class="kicker"><span class="chip ${chipcls}">${chip}</span> ${h} <span class="tag">// ${tag}</span></div>`;
  const slides = `
  <section class="slide dark cover">
    <img src="/logo.svg" alt="Riposte Laboratories">
    <div class="lede">${S('deck.cover.lede')}</div>
    <div class="rule"></div>
    <div class="marq"><span>parry</span><span class="r">♻</span><span>riposte</span><span class="r">♻</span><span>recycle</span><span class="r">♻</span><span>repeat</span></div>
    <p class="dim" style="margin-top:34px;font-size:12px;letter-spacing:.1em">${S('deck.cover.foot')}</p>
  </section>
  <section class="slide">
    ${kick('SEC.01','pink',S('deck.problem.h'),S('deck.problem.tag'))}
    <h1>${S('deck.problem.h1')}</h1>
    <div class="cols3">
      <div class="stat"><div class="n pink">6.5%</div><div class="l">${S('deck.problem.s1')}</div></div>
      <div class="stat"><div class="n orange">$0 in BC</div><div class="l">${S('deck.problem.s2')}</div></div>
      <div class="stat"><div class="n teal">Oct 2027</div><div class="l">${S('deck.problem.s3')}</div></div>
    </div>
    <p class="big">${S('deck.problem.big')}</p>
  </section>
  <section class="slide dark">
    ${kick('SEC.02','',S('deck.thesis.h'),S('deck.thesis.tag'))}
    <h1>${S('deck.thesis.h1')}</h1>
    <p class="big">${S('deck.thesis.big')}</p>
    ${flow(t,[{n:'01',label:'flow.intake',sub:'flow.intake.sub'},{n:'02',label:'flow.parry',sub:'flow.parry.sub'},{n:'03',label:'flow.riposte',sub:'flow.riposte.sub'},{n:'04',label:'flow.return',sub:'flow.return.sub'}])}
  </section>
  <section class="slide">
    ${kick('SEC.03','orange',S('deck.model.h'),S('deck.model.tag'))}
    <h1>${S('deck.model.h1')}</h1>
    <div class="cols">
      <div><p class="big">${S('deck.model.big')}</p></div>
      <div class="spec"><div class="spec-h"><span>${S('deck.model.spec.h')}</span><span>RL-200</span></div>${specUL([1,2,3,4,5].map(i=>S('deck.model.spec.'+i)))}</div>
    </div>
  </section>
  <section class="slide">
    ${kick('SEC.04','teal',S('deck.lines.h'),S('deck.lines.tag'))}
    <h1>${S('deck.lines.h1')}</h1>
    <div class="cols">
      <div class="stat"><div class="n orange">Plastic Works</div><div class="l" style="text-transform:none;font-size:14px;line-height:1.6">${S('deck.lines.s1.l')}</div></div>
      <div class="stat"><div class="n teal">Project HEX</div><div class="l" style="text-transform:none;font-size:14px;line-height:1.6">${S('deck.lines.s2.l')}</div></div>
    </div>
    <p class="illus">${S('deck.lines.illus')}</p>
  </section>
  <section class="slide dark">
    ${kick('SEC.05','',S('deck.flagship.h'),S('deck.flagship.tag'))}
    <div class="cols">
      <div style="display:grid;place-items:center">${HEXUNIT.replace('<svg ','<svg style="width:min(360px,80vw)" ')}</div>
      <div>
        <h2>${S('deck.flagship.h1')}</h2>
        <div class="spec tealhd" style="margin-top:18px"><div class="spec-h"><span>${S('deck.flagship.spec.h')}</span><span>RL-H01</span></div>${specUL([1,2,3,4,5,6].map(i=>S('deck.flagship.spec.'+i)))}</div>
        ${stamp(t,'home.hex.stamp')}
      </div>
    </div>
  </section>
  <section class="slide pink">
    ${kick('SEC.06','',S('deck.vision.h'),S('deck.vision.tag'))}
    <h1>${S('deck.vision.h1')}</h1>
    <div class="cols">
      <div style="display:grid;place-items:center">${DOME.replace('<svg ','<svg style="width:min(440px,88vw)" ')}</div>
      <div><p class="big">${S('deck.vision.big')}</p></div>
    </div>
  </section>
  <section class="slide">
    ${kick('SEC.07','pink',S('deck.whynow.h'),S('deck.whynow.tag'))}
    <h1>${S('deck.whynow.h1')}</h1>
    <div class="pills">${[1,2,3,4,5,6].map(i=>`<span class="pill">${S('deck.whynow.pill'+i)}</span>`).join('')}</div>
    <p class="big">${S('deck.whynow.big')}</p>
  </section>
  <section class="slide dark">
    ${kick('SEC.08','',S('deck.market.h'),S('deck.market.tag'))}
    <h1>${S('deck.market.h1')}</h1>
    <div class="cols3">
      <div class="stat"><div class="n teal">$[TAM]</div><div class="l">${S('deck.market.s1.l')}</div></div>
      <div class="stat"><div class="n pink">$[SAM]</div><div class="l">${S('deck.market.s2.l')}</div></div>
      <div class="stat"><div class="n orange">$[SOM]</div><div class="l">${S('deck.market.s3.l')}</div></div>
    </div>
    <p class="illus">${S('deck.market.illus')}</p>
  </section>
  <section class="slide">
    ${kick('SEC.09','orange',S('deck.biz.h'),S('deck.biz.tag'))}
    <h1>${S('deck.biz.h1')}</h1>
    <div class="cols">
      <div><div class="pills" style="margin-top:6px">${[1,2,3,4].map(i=>`<span class="pill">${S('deck.biz.pill'+i)}</span>`).join('')}</div><p>${S('deck.biz.p')}</p></div>
      <div class="spec orangehd"><div class="spec-h"><span>${S('deck.biz.spec.h')}</span><span>RL-U</span></div>${specUL([1,2,3,4,5,6].map(i=>S('deck.biz.spec.'+i)))}</div>
    </div>
    <p class="illus">${S('deck.biz.illus')}</p>
  </section>
  <section class="slide dark">
    ${kick('SEC.10','',S('deck.roadmap.h'),S('deck.roadmap.tag'))}
    <h1>${S('deck.roadmap.h1')}</h1>
    <div class="rail">
      <div class="r"><div class="yr">${S('deck.roadmap.now')}<span class="ph">${S('deck.roadmap.r1.ph')}</span></div><div class="d">${S('deck.roadmap.r1.d')}</div></div>
      <div class="r"><div class="yr">[Q_/__]<span class="ph">${S('deck.roadmap.r2.ph')}</span></div><div class="d">${S('deck.roadmap.r2.d')}</div></div>
      <div class="r"><div class="yr">[__]<span class="ph">${S('deck.roadmap.r3.ph')}</span></div><div class="d">${S('deck.roadmap.r3.d')}</div></div>
      <div class="r"><div class="yr">[__]<span class="ph">${S('deck.roadmap.r4.ph')}</span></div><div class="d">${S('deck.roadmap.r4.d')}</div></div>
    </div>
    <p class="illus">${S('deck.roadmap.illus')}</p>
  </section>
  <section class="slide">
    ${kick('SEC.11','teal',S('deck.team.h'),S('deck.team.tag'))}
    <h1>${S('deck.team.h1')}</h1>
    <div class="cols3">
      <div class="stat"><div class="n teal">${S('deck.team.s1.n')}</div><div class="l">${S('deck.team.s1.l')}</div></div>
      <div class="stat"><div class="n pink">${S('deck.team.s2.n')}</div><div class="l">${S('deck.team.s2.l')}</div></div>
      <div class="stat"><div class="n orange">${S('deck.team.s3.n')}</div><div class="l">${S('deck.team.s3.l')}</div></div>
    </div>
    <p class="illus">${S('deck.team.illus')}</p>
  </section>
  <section class="slide dark">
    ${kick('SEC.12','',S('deck.ask.h'),S('deck.ask.tag'))}
    <h1>${S('deck.ask.h1')}</h1>
    <div class="cols">
      <div>
        <div class="tbd"><div class="k">${S('deck.ask.raising.k')}</div><div class="v">${S('deck.ask.raising.v')}</div></div>
        <div class="tbd" style="margin-top:12px"><div class="k">${S('deck.ask.val.k')}</div><div class="v">${S('deck.ask.val.v')}</div></div>
        <div class="tbd" style="margin-top:12px"><div class="k">${S('deck.ask.runway.k')}</div><div class="v">${S('deck.ask.runway.v')}</div></div>
      </div>
      <div>
        <h2 style="font-size:18px;letter-spacing:.06em;text-transform:uppercase">${S('deck.ask.use.h')} <span class="dim">${S('deck.ask.use.note')}</span></h2>
        <div class="usebars">
          <div class="row"><span>[40%]</span><div class="bar"><span style="width:40%"></span></div><span>${S('deck.ask.use.1')}</span></div>
          <div class="row"><span>[30%]</span><div class="bar"><span style="width:30%"></span></div><span>${S('deck.ask.use.2')}</span></div>
          <div class="row"><span>[20%]</span><div class="bar"><span style="width:20%"></span></div><span>${S('deck.ask.use.3')}</span></div>
          <div class="row"><span>[10%]</span><div class="bar"><span style="width:10%"></span></div><span>${S('deck.ask.use.4')}</span></div>
        </div>
      </div>
    </div>
    <p class="illus">${S('deck.ask.illus')}</p>
  </section>
  <section class="slide pink cover">
    <img src="/logo.svg" alt="Riposte Laboratories">
    <div class="lede">${S('deck.close.lede')}</div>
    <a class="bigmail" href="mailto:esh@ripostelabs.xyz">✉ esh@ripostelabs.xyz</a>
    <p class="dim" style="margin-top:26px;font-size:12px;letter-spacing:.1em">${S('deck.close.foot')}</p>
  </section>
  <section class="slide dark sources" id="sources">
    <div class="kicker"><span class="chip">APPENDIX</span> ${S('deck.sources.h')} <span class="tag">// ${S('sources.tag')}</span></div>
    <h2>${S('deck.sources.h')}</h2>
    ${dfn(['dsrc.1','dsrc.2','dsrc.3','dsrc.4','dsrc.5','dsrc.6','dsrc.7','dsrc.8','dsrc.9'])}
    <p class="illus">${S('deck.sources.foot')}</p>
  </section>`;
  return {slides, count: (slides.match(/class="slide/g)||[]).length};
}

/* ============================================================================
   ALT renderers (alt.css design) — shared block builders + light section head
   ============================================================================ */
const HEX_ALT = `<svg viewBox="0 0 240 250" fill="none" stroke="currentColor" aria-label="HEX unit">
  <polygon points="196,120 156,51 76,51 36,120 76,189 156,189" stroke-width="2.5"/>
  <polygon points="166,120 143,80 97,80 74,120 97,160 143,160" stroke-width="1.6"/>
  <line x1="120" y1="80" x2="120" y2="160" stroke-width="1.1"/><line x1="97" y1="80" x2="143" y2="160" stroke-width="1.1"/><line x1="143" y1="80" x2="97" y2="160" stroke-width="1.1"/>
  <text x="120" y="116" fill="currentColor" stroke="none" font-size="9" text-anchor="middle" font-family="monospace" font-weight="700">SOLAR</text>
  <text x="120" y="132" fill="currentColor" stroke="none" font-size="7.5" text-anchor="middle" font-family="monospace">TOP FACE</text>
  <g stroke-width="1.6">${[0,60,120,180,240,300].map(a=>`<g transform="rotate(${a} 120 120)"><rect x="92" y="43" width="56" height="15" rx="7.5"/></g>`).join('')}</g>
  <text x="120" y="218" fill="currentColor" stroke="none" font-size="12" text-anchor="middle" font-family="monospace" font-weight="700">6S &#183; 14.46 Wh</text>
  <text x="120" y="234" fill="currentColor" stroke="none" font-size="8.5" text-anchor="middle" font-family="monospace">6 &#215; 2.41 Wh &#183; 45 &#215; 13 mm cells</text>
</svg>`;
function aSechead(sec, cN, h, tag){
  return `<div class="sechead"><span class="seclab ${cN}">${sec}</span><h2>${h}</h2><span class="rt">${tag}</span></div><p class="sectag">${tag}</p>`;
}
function aSpec(head, doc, cN, lis){
  return `<div class="spec ${cN}"><div class="spec-h"><span>${head}</span><span class="doc">${doc}</span></div><ul>${lis.map(l=>`<li>${l}</li>`).join('')}</ul></div>`;
}
function aBand(type){ return `<div class="band ${type||''}"></div>`; }

function altHome(t){
  const S=k=>t[k];
  return `
<section class="hero">
  <img class="wordmark" src="/logo.svg" alt="Riposte Laboratories" width="560">
  <p class="eyebrow">${S('home.eyebrow')}</p>
  <h1><span class="p">${S('home.h1a')}</span> ${S('home.h1b')}</h1>
  <p class="sub">${S('home.sub')}</p>
  <a class="cta" href="#mission">${S('home.cta')} ↓</a>
</section>
<section class="sec wrap" id="mission">
  ${aSechead('SEC.01','c1',S('home.mission.h'),S('home.mission.tag'))}
  <p class="lead">${S('home.mission.def')}</p>
  ${flow(t,[{n:'01',label:'flow.intake',sub:'flow.intake.sub'},{n:'02',label:'flow.parry',sub:'flow.parry.sub'},{n:'03',label:'flow.riposte',sub:'flow.riposte.sub'},{n:'04',label:'flow.return',sub:'flow.return.sub'}])}
  <div class="stack"><p>${S('home.mission.p1')}</p><p>${S('home.mission.p2')}</p></div>
</section>
${aBand('')}
<section class="sec wrap" id="plastics">
  ${aSechead('SEC.02','c2',S('home.plastics.h'),S('home.plastics.tag'))}
  <p class="lead">${S('home.plastics.lead')}</p>
  ${aSpec(S('home.plastics.spec.h'),'RL-P01','c2',[1,2,3,4,5].map(i=>S('home.plastics.spec.'+i)))}
  <div class="stack"><p>${S('home.plastics.p1')}</p><p class="dim">${S('home.plastics.p2')}</p></div>
</section>
${aBand('harlequin')}
<section class="sec wrap" id="hex">
  ${aSechead('SEC.03','c3',S('home.hex.h'),S('home.hex.tag'))}
  <p class="lead">${S('home.hex.lead')}</p>
  <div class="hexfig">${HEX_ALT}</div>
  ${aSpec(S('home.hex.spec.h'),'RL-H01','c3',[1,2,3,4,5,6,7,8].map(i=>S('home.hex.spec.'+i)))}
  <div class="stack"><p>${S('home.hex.p1')}</p><p>${S('home.hex.p2')}</p><p>${S('home.hex.p3')}</p></div>
  ${stamp(t,'home.hex.stamp')}
</section>
${aBand('teal')}
<section class="sec wrap" id="esh">
  ${aSechead('SEC.04','c1',S('home.esh.h'),S('home.esh.tag'))}
  <p class="lead">${S('home.esh.lead')}</p>
  ${aSpec(S('home.esh.spec.h'),'RL-E01','c1',[1,2,3,4,5].map(i=>S('home.esh.spec.'+i)))}
  <p>${S('home.esh.p1')}</p>
</section>
${aBand('')}
<section class="sec wrap" id="contact">
  ${aSechead('SEC.05','c3',S('home.contact.h'),S('home.contact.tag'))}
  <p class="lead">${S('home.contact.lead')}</p>
  <a class="bigmail" href="mailto:esh@ripostelabs.xyz">✉ esh@ripostelabs.xyz</a>
</section>
${aBand('')}
<section class="sec wrap" id="sources">
  ${aSechead('REF','c2',S('sources.h'),S('sources.tag'))}
  ${fnlist(t,['src.statcan','src.apr','src.rcbc'])}
</section>`;
}

function altPagehead(kicker,h1,intro){
  return `<div class="pagehead wrap"><div class="kicker">${kicker}</div><h1>${h1}</h1><p>${intro}</p></div>`;
}
function altProcess(t){
  const S=k=>t[k];
  const contact = url('en','full','home')+'#contact';
  return `
${altPagehead(S('process.kicker'),S('process.h1'),S('process.intro'))}
${aBand('')}
<section class="sec wrap">
  ${aSechead('SEC.01','c1',S('process.model.h'),S('process.model.tag'))}
  <p class="lead">${S('process.model.lead')}</p>
  ${aSpec(S('process.model.spec.h'),'RL-200','c1',[1,2,3,4,5].map(i=>S('process.model.spec.'+i)))}
  <div class="stack"><p>${S('process.model.p1')}</p><p>${S('process.model.p2')}</p></div>
  ${flow(t,[{n:'01',label:'flow.partner',sub:'flow.partner.sub'},{n:'02',label:'flow.collect',sub:'flow.collect.sub'},{n:'03',label:'flow.riposte',sub:'flow.riposte2.sub'},{n:'04',label:'flow.return',sub:'flow.return.sub'}])}
</section>
${aBand('harlequin')}
<section class="sec wrap">
  ${aSechead('SEC.02','c2',S('process.plastic.h'),S('process.plastic.tag'))}
  <p class="lead">${S('process.plastic.lead')}</p>
  ${aSpec(S('process.plastic.spec.h'),'RL-P02','c2',[1,2,3,4,5,6].map(i=>S('process.plastic.spec.'+i)))}
  <div class="stack"><p>${S('process.plastic.p1')}</p><p>${S('process.plastic.p2')}</p><p class="dim">${S('process.plastic.p3')}</p></div>
</section>
${aBand('teal')}
<section class="sec wrap">
  ${aSechead('SEC.03','c3',S('process.battery.h'),S('process.battery.tag'))}
  <p class="lead">${S('process.battery.lead')}</p>
  ${aSpec(S('process.battery.spec.h'),'RL-H02','c3',[1,2,3,4,5,6,7].map(i=>S('process.battery.spec.'+i)))}
  <div class="stack"><p>${S('process.battery.p1')}</p><p>${S('process.battery.p2')}</p><p>${S('process.battery.p3')}</p><p class="dim">${S('process.battery.p4')}</p></div>
  ${stamp(t,'process.battery.stamp')}
</section>
${aBand('harlequin')}
<section class="sec wrap">
  ${aSechead('SEC.04','c1',S('process.network.h'),S('process.network.tag'))}
  <p class="lead">${S('process.network.lead')}</p>
  <div class="grid">
    ${['1','2','3','4'].map(n=>`<div class="partner"><span class="p-n">TYPE 0${n}</span><b>${S('process.network.p'+n+'.name')}</b><p>${S('process.network.p'+n+'.desc')}</p><div class="drops">${S('process.network.p'+n+'.drops')}</div></div>`).join('')}
  </div>
  ${note(t,'process.network.note.h','process.network.note.body',{contact})}
</section>
${aBand('')}
<section class="sec wrap">
  ${aSechead('REF','c3',S('sources.h'),S('sources.tag'))}
  ${fnlist(t,['src.apr2','src.rcbc2','src.tc','src.reg','src.fire'])}
</section>`;
}

function altRecyc(t){
  const S=k=>t[k];
  const contact = url('en','full','home')+'#contact';
  const toc = [['basics','01','toc.basics'],['plastics','02','toc.plastics'],['paper','03','toc.paper'],['glass','04','toc.glass'],['metal','05','toc.metal'],['batteries','06','toc.batteries'],['organics','07','toc.organics'],['textiles','08','toc.textiles'],['rules','09','toc.rules'],['sources','REF','toc.sources']];
  return `
${altPagehead(S('recyc.kicker'),S('recyc.h1'),S('recyc.intro'))}
${aBand('')}
<div class="wrap">
  <nav class="toc" aria-label="On this page"><div class="toc-h">${S('recyc.toc.h')}</div>${toc.map(x=>`<a href="#${x[0]}"><span class="n">${x[1]}</span>${S(x[2])}</a>`).join('')}</nav>
  <section class="sec" id="basics">
    ${aSechead('SEC.01','c1',S('recyc.basics.h'),S('recyc.basics.tag'))}
    <p class="lead">${S('recyc.basics.lead')}</p>
    <div class="stack"><p>${S('recyc.basics.p1')}</p><p>${S('recyc.basics.p2')}</p><p>${S('recyc.basics.p3')}</p></div>
    ${note(t,'recyc.basics.note.h','recyc.basics.note.body')}
  </section>
  <section class="sec" id="plastics">
    ${aSechead('SEC.02','c2',S('recyc.plastics.h'),S('recyc.plastics.tag'))}
    <p class="lead">${S('recyc.plastics.lead')}</p><p>${S('recyc.plastics.p1')}</p>
    ${codesGrid(t,[{n:'1',kind:'good',name:'PET',desc:'code.1'},{n:'2',kind:'good',name:'HDPE',desc:'code.2'},{n:'3',kind:'bad',name:'PVC',desc:'code.3'},{n:'4',kind:'some',name:'LDPE',desc:'code.4'},{n:'5',kind:'some',name:'PP',desc:'code.5'},{n:'6',kind:'bad',name:'PS',desc:'code.6'},{n:'7',kind:'bad',name:'Other',desc:'code.7'}])}
    ${verdictDuo(t,[{kind:'yes',h:'recyc.plastics.yes.h',items:['recyc.plastics.yes.1','recyc.plastics.yes.2','recyc.plastics.yes.3','recyc.plastics.yes.4']},{kind:'no',h:'recyc.plastics.no.h',items:['recyc.plastics.no.1','recyc.plastics.no.2','recyc.plastics.no.3','recyc.plastics.no.4']}])}
    ${note(t,'recyc.plastics.note.h','recyc.plastics.note.body')}
  </section>
  <section class="sec" id="paper">
    ${aSechead('SEC.03','c3',S('recyc.paper.h'),S('recyc.paper.tag'))}
    <p class="lead">${S('recyc.paper.lead')}</p><p>${S('recyc.paper.p1')}</p>
    ${verdictDuo(t,[{kind:'yes',h:'recyc.paper.yes.h',items:['recyc.paper.yes.1','recyc.paper.yes.2','recyc.paper.yes.3','recyc.paper.yes.4']},{kind:'no',h:'recyc.paper.no.h',items:['recyc.paper.no.1','recyc.paper.no.2','recyc.paper.no.3','recyc.paper.no.4']}])}
  </section>
  <section class="sec" id="glass">
    ${aSechead('SEC.04','c1',S('recyc.glass.h'),S('recyc.glass.tag'))}
    <p class="lead">${S('recyc.glass.lead')}</p><p>${S('recyc.glass.p1')}</p>
    ${verdictDuo(t,[{kind:'yes',h:'recyc.glass.yes.h',items:['recyc.glass.yes.1','recyc.glass.yes.2']},{kind:'no',h:'recyc.glass.no.h',items:['recyc.glass.no.1','recyc.glass.no.2','recyc.glass.no.3','recyc.glass.no.4']}])}
  </section>
  <section class="sec" id="metal">
    ${aSechead('SEC.05','c2',S('recyc.metal.h'),S('recyc.metal.tag'))}
    <p class="lead">${S('recyc.metal.lead')}</p><p>${S('recyc.metal.p1')}</p>
    ${verdictDuo(t,[{kind:'yes',h:'recyc.metal.yes.h',items:['recyc.metal.yes.1','recyc.metal.yes.2','recyc.metal.yes.3','recyc.metal.yes.4']},{kind:'no',h:'recyc.metal.no.h',items:['recyc.metal.no.1','recyc.metal.no.2','recyc.metal.no.3']}])}
  </section>
  <section class="sec" id="batteries">
    ${aSechead('SEC.06','c3',S('recyc.batteries.h'),S('recyc.batteries.tag'))}
    <p class="lead">${S('recyc.batteries.lead')}</p>
    <div class="stack"><p>${S('recyc.batteries.p1')}</p><p>${S('recyc.batteries.p2')}</p><p>${S('recyc.batteries.p3')}</p></div>
    ${verdictDuo(t,[{kind:'warn',h:'recyc.batteries.warn.h',items:['recyc.batteries.warn.1','recyc.batteries.warn.2','recyc.batteries.warn.3','recyc.batteries.warn.4']},{kind:'no',h:'recyc.batteries.no.h',items:['recyc.batteries.no.1','recyc.batteries.no.2','recyc.batteries.no.3','recyc.batteries.no.4']}])}
    ${note(t,'recyc.batteries.note.h','recyc.batteries.note.body',{contact})}
  </section>
  <section class="sec" id="organics">
    ${aSechead('SEC.07','c1',S('recyc.organics.h'),S('recyc.organics.tag'))}
    <p class="lead">${S('recyc.organics.lead')}</p><p>${S('recyc.organics.p1')}</p>
    ${verdictDuo(t,[{kind:'yes',h:'recyc.organics.yes.h',items:['recyc.organics.yes.1','recyc.organics.yes.2','recyc.organics.yes.3']},{kind:'no',h:'recyc.organics.no.h',items:['recyc.organics.no.1','recyc.organics.no.2','recyc.organics.no.3']}])}
  </section>
  <section class="sec" id="textiles">
    ${aSechead('SEC.08','c2',S('recyc.textiles.h'),S('recyc.textiles.tag'))}
    <p class="lead">${S('recyc.textiles.lead')}</p><p>${S('recyc.textiles.p1')}</p>
    ${verdictDuo(t,[{kind:'yes',h:'recyc.textiles.yes.h',items:['recyc.textiles.yes.1','recyc.textiles.yes.2','recyc.textiles.yes.3']},{kind:'no',h:'recyc.textiles.no.h',items:['recyc.textiles.no.1','recyc.textiles.no.2']}])}
  </section>
  <section class="sec" id="rules">
    ${aSechead('SEC.09','c3',S('recyc.rules.h'),S('recyc.rules.tag'))}
    <p class="lead">${S('recyc.rules.lead')}</p>
    ${rulesGrid(t,[{n:'01',t:'recyc.rules.1.t',d:'recyc.rules.1.d'},{n:'02',t:'recyc.rules.2.t',d:'recyc.rules.2.d'},{n:'03',t:'recyc.rules.3.t',d:'recyc.rules.3.d'},{n:'04',t:'recyc.rules.4.t',d:'recyc.rules.4.d'},{n:'05',t:'recyc.rules.5.t',d:'recyc.rules.5.d'}])}
  </section>
  <section class="sec" id="sources">
    ${aSechead('REF','c1',S('sources.h'),S('sources.tag'))}
    <p class="lead">${S('recyc.sources.lead')}</p>
    ${fnlist(t,['src.statcan','src.rcbc3','src.fire','src.reg2'])}
  </section>
</div>`;
}

function altDeck(t){
  const S=k=>t[k];
  const stat=(n,l)=>`<div class="stat"><div class="n">${n}</div><div class="l">${l}</div></div>`;
  return `
${altPagehead(S('deck.kicker'),S('deck.title'),S('deck.cover.tagline'))}
${aBand('')}
<section class="sec wrap">${aSechead('SEC.01','c1',S('deck.problem.h'),S('deck.problem.tag'))}
  <p class="lead">${S('deck.problem.h1')}</p>
  <div class="grid">${stat('6.5%',S('deck.problem.s1'))}${stat('$0 in BC',S('deck.problem.s2'))}${stat('Oct 2027',S('deck.problem.s3'))}</div>
  <p class="lead">${S('deck.problem.big')}</p></section>
${aBand('harlequin')}
<section class="sec wrap">${aSechead('SEC.02','c2',S('deck.thesis.h'),S('deck.thesis.tag'))}
  <p class="lead">${S('deck.thesis.h1')}</p><p>${S('deck.thesis.big')}</p>
  ${flow(t,[{n:'01',label:'flow.intake',sub:'flow.intake.sub'},{n:'02',label:'flow.parry',sub:'flow.parry.sub'},{n:'03',label:'flow.riposte',sub:'flow.riposte.sub'},{n:'04',label:'flow.return',sub:'flow.return.sub'}])}</section>
${aBand('')}
<section class="sec wrap">${aSechead('SEC.03','c3',S('deck.model.h'),S('deck.model.tag'))}
  <p class="lead">${S('deck.model.h1')}</p><p>${S('deck.model.big')}</p>
  ${aSpec(S('deck.model.spec.h'),'RL-200','',[1,2,3,4,5].map(i=>S('deck.model.spec.'+i)))}</section>
${aBand('teal')}
<section class="sec wrap">${aSechead('SEC.04','c1',S('deck.lines.h'),S('deck.lines.tag'))}
  <p class="lead">${S('deck.lines.h1')}</p>
  <div class="grid">${stat('Plastic Works',S('deck.lines.s1.l'))}${stat('Project HEX',S('deck.lines.s2.l'))}</div>
  <p class="illus">${S('deck.lines.illus')}</p></section>
${aBand('harlequin')}
<section class="sec wrap">${aSechead('SEC.05','c3',S('deck.flagship.h'),S('deck.flagship.tag'))}
  <p class="lead">${S('deck.flagship.h1')}</p>
  <div class="hexfig">${HEX_ALT}</div>
  ${aSpec(S('deck.flagship.spec.h'),'RL-H01','c3',[1,2,3,4,5,6].map(i=>S('deck.flagship.spec.'+i)))}
  ${stamp(t,'home.hex.stamp')}</section>
${aBand('')}
<section class="sec wrap">${aSechead('SEC.06','c2',S('deck.vision.h'),S('deck.vision.tag'))}
  <p class="lead">${S('deck.vision.h1')}</p><p>${S('deck.vision.big')}</p></section>
${aBand('teal')}
<section class="sec wrap">${aSechead('SEC.07','c1',S('deck.whynow.h'),S('deck.whynow.tag'))}
  <p class="lead">${S('deck.whynow.h1')}</p>
  ${pills(t,['deck.whynow.pill1','deck.whynow.pill2','deck.whynow.pill3','deck.whynow.pill4','deck.whynow.pill5','deck.whynow.pill6'])}
  <p class="lead">${S('deck.whynow.big')}</p></section>
${aBand('harlequin')}
<section class="sec wrap">${aSechead('SEC.08','c3',S('deck.market.h'),S('deck.market.tag'))}
  <p class="lead">${S('deck.market.h1')}</p>
  <div class="grid">${stat('$[TAM]',S('deck.market.s1.l'))}${stat('$[SAM]',S('deck.market.s2.l'))}${stat('$[SOM]',S('deck.market.s3.l'))}</div>
  <p class="illus">${S('deck.market.illus')}</p></section>
${aBand('')}
<section class="sec wrap">${aSechead('SEC.09','c1',S('deck.biz.h'),S('deck.biz.tag'))}
  <p class="lead">${S('deck.biz.h1')}</p>
  ${pills(t,['deck.biz.pill1','deck.biz.pill2','deck.biz.pill3','deck.biz.pill4'])}
  <p>${S('deck.biz.p')}</p>
  ${aSpec(S('deck.biz.spec.h'),'RL-U','c2',[1,2,3,4,5,6].map(i=>S('deck.biz.spec.'+i)))}
  <p class="illus">${S('deck.biz.illus')}</p></section>
${aBand('teal')}
<section class="sec wrap">${aSechead('SEC.10','c3',S('deck.roadmap.h'),S('deck.roadmap.tag'))}
  <p class="lead">${S('deck.roadmap.h1')}</p>
  <div class="rail">
    <div class="r"><div class="yr">${S('deck.roadmap.now')}<span class="ph">${S('deck.roadmap.r1.ph')}</span></div><div class="d">${S('deck.roadmap.r1.d')}</div></div>
    <div class="r"><div class="yr">[Q_/__]<span class="ph">${S('deck.roadmap.r2.ph')}</span></div><div class="d">${S('deck.roadmap.r2.d')}</div></div>
    <div class="r"><div class="yr">[__]<span class="ph">${S('deck.roadmap.r3.ph')}</span></div><div class="d">${S('deck.roadmap.r3.d')}</div></div>
    <div class="r"><div class="yr">[__]<span class="ph">${S('deck.roadmap.r4.ph')}</span></div><div class="d">${S('deck.roadmap.r4.d')}</div></div>
  </div>
  <p class="illus">${S('deck.roadmap.illus')}</p></section>
${aBand('harlequin')}
<section class="sec wrap">${aSechead('SEC.11','c2',S('deck.team.h'),S('deck.team.tag'))}
  <p class="lead">${S('deck.team.h1')}</p>
  <div class="grid">${stat(S('deck.team.s1.n'),S('deck.team.s1.l'))}${stat(S('deck.team.s2.n'),S('deck.team.s2.l'))}${stat(S('deck.team.s3.n'),S('deck.team.s3.l'))}</div>
  <p class="illus">${S('deck.team.illus')}</p></section>
${aBand('')}
<section class="sec wrap">${aSechead('SEC.12','c3',S('deck.ask.h'),S('deck.ask.tag'))}
  <p class="lead">${S('deck.ask.h1')}</p>
  <div class="duo">
    <div>
      <div class="tbd"><div class="k">${S('deck.ask.raising.k')}</div><div class="v">${S('deck.ask.raising.v')}</div></div>
      <div class="tbd" style="margin-top:12px"><div class="k">${S('deck.ask.val.k')}</div><div class="v">${S('deck.ask.val.v')}</div></div>
      <div class="tbd" style="margin-top:12px"><div class="k">${S('deck.ask.runway.k')}</div><div class="v">${S('deck.ask.runway.v')}</div></div>
    </div>
    <div>
      <h3 style="font-size:15px;letter-spacing:.05em">${S('deck.ask.use.h')} <span class="dim">${S('deck.ask.use.note')}</span></h3>
      <div class="usebars">
        <div class="row"><span>[40%]</span><div class="bar"><span style="width:40%"></span></div><span>${S('deck.ask.use.1')}</span></div>
        <div class="row"><span>[30%]</span><div class="bar"><span style="width:30%"></span></div><span>${S('deck.ask.use.2')}</span></div>
        <div class="row"><span>[20%]</span><div class="bar"><span style="width:20%"></span></div><span>${S('deck.ask.use.3')}</span></div>
        <div class="row"><span>[10%]</span><div class="bar"><span style="width:10%"></span></div><span>${S('deck.ask.use.4')}</span></div>
      </div>
    </div>
  </div>
  <p class="illus">${S('deck.ask.illus')}</p></section>
${aBand('')}
<section class="sec wrap">${aSechead('SEC.13','c1',S('deck.close.h'),S('deck.close.tag'))}
  <a class="bigmail" href="mailto:esh@ripostelabs.xyz">✉ esh@ripostelabs.xyz</a>
  <p class="dim">${S('deck.close.foot')}</p></section>
${aBand('')}
<section class="sec wrap" id="sources">${aSechead('APPENDIX','c2',S('deck.sources.h'),S('sources.tag'))}
  ${fnlist(t,['dsrc.1','dsrc.2','dsrc.3','dsrc.4','dsrc.5','dsrc.6','dsrc.7','dsrc.8','dsrc.9'])}
  <p class="illus">${S('deck.sources.foot')}</p></section>`;
}

/* ============================================================================
   shells
   ============================================================================ */
function fullNav(t, code){
  const u = (v,p)=>url(code,v,p); // full nav links to full pages in same lang
  const home = url(code,'full','home');
  return `<header class="topbar">
  <a class="brand" href="${home}"><div class="mark"><img src="/logo.svg" alt="Riposte Laboratories" width="110"></div><span>Laboratories&nbsp;Inc.</span></a>
  <nav class="mainnav">
    <div class="navgroup"><button class="navtop" type="button">${t['nav.company']} <span class="car">▾</span></button>
      <div class="navmenu"><a href="${home}#mission">${t['nav.mission']} <span class="ar">→</span></a><a href="${home}#esh">${t['nav.esh']} <span class="ar">→</span></a><a href="${home}#contact">${t['nav.contact']} <span class="ar">→</span></a></div></div>
    <div class="navgroup"><button class="navtop" type="button">${t['nav.projects']} <span class="car">▾</span></button>
      <div class="navmenu"><a href="${home}#plastics">${t['nav.plastics']} <span class="ar">→</span></a><a href="${home}#hex">${t['nav.hex']} <span class="ar">→</span></a></div></div>
    <div class="navgroup"><button class="navtop" type="button">${t['nav.process']} <span class="car">▾</span></button>
      <div class="navmenu"><a href="${u('full','process')}">${t['nav.ourprocess']} <span class="ar">→</span></a><a href="${u('full','recycling101')}">${t['nav.recycling101']} <span class="ar">→</span></a></div></div>
  </nav>
</header>`;
}
function utilbar(t, code, variant, pageKey){
  return `<div class="utilbar"><div class="uwrap">${vswitch(t,code,variant,pageKey)}${langpick(t,code,variant,pageKey)}</div>${mtnote(t,code)}</div>`;
}
function footer(t, code, variant, pageKey){
  return `<footer>
  <div class="l">${t['footer.rights']}</div>
  <div class="r">${t['footer.loop']}</div>
</footer>`;
}

function pageTitle(t, pageKey){
  const map = {home:t['home.title'], process:t['process.title'], recycling101:t['recyc.title'], deck:t['deck.title']};
  return map[pageKey] + ' · Riposte Laboratories Inc.';
}
function pageDesc(t, pageKey){
  const map = {home:t['home.desc'], process:t['process.desc'], recycling101:t['recyc.desc'], deck:t['deck.desc']};
  return map[pageKey];
}

function shellFull(code, pageKey){
  const t = loadStrings(code);
  const L = LANGS.find(l=>l.code===code);
  const dirAttr = L.dir==='rtl' ? ' dir="rtl"' : '';
  // deck is self-contained (own css + slide engine)
  if(pageKey==='deck'){
    const d = fullDeck(t);
    return `<!DOCTYPE html>
<html lang="${L.hreflang}"${dirAttr}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Riposte Laboratories · ${t['deck.title']}</title>
<link rel="canonical" href="${url(code,'full','deck')}">
${hreflangs('full','deck')}
<style>
${DECK_CSS}
/* language + version utility strip for translated decks */
.uvbar{position:fixed;top:46px;left:0;right:0;z-index:99;display:flex;gap:10px;justify-content:flex-end;align-items:center;padding:5px 12px;background:#2b2723;color:var(--bone);border-bottom:2px solid var(--bone);font-size:11px}
.uvbar a{color:var(--bone)}
.uvbar .vswitch{display:flex;border:2px solid var(--bone)} .uvbar .vswitch a{padding:3px 8px;text-decoration:none;border-left:1px dashed var(--bone)} .uvbar .vswitch a:first-child{border-left:none} .uvbar .vswitch a[aria-current]{background:var(--bone);color:var(--ink);font-weight:700}
.uvbar .langpick>summary{list-style:none;cursor:pointer;border:2px solid var(--bone);padding:3px 9px;display:flex;gap:6px;align-items:center} .uvbar .langpick>summary::-webkit-details-marker{display:none}
.uvbar .langmenu{position:absolute;top:30px;inset-inline-end:12px;background:var(--ink);border:2px solid var(--bone);display:grid;grid-template-columns:1fr 1fr;min-width:220px;max-height:60vh;overflow:auto}
.uvbar .langmenu a{padding:7px 10px;text-decoration:none;border-bottom:1px dashed var(--bone)} .uvbar .langmenu a[aria-current]{background:var(--bone);color:var(--ink)} .uvbar .langmenu a .en{display:block;font-size:9px;opacity:.6}
.deck{padding-top:28px}
</style>
</head>
<body>
<div class="chrome">
  <a href="${url(code,'full','home')}"><img src="/logo.svg" alt="Riposte Laboratories"> <span>← ${t['nav.home']}</span></a>
  <span>${t['deck.title']}</span>
  <span class="doc">DOC NO. RL-DECK-01 · Confidential</span>
</div>
<div class="uvbar">${vswitch(t,code,'full','deck')}${langpick(t,code,'full','deck')}</div>
<div class="prog" id="prog"></div>
<main class="deck" id="deck">
${d.slides}
</main>
<div class="pager"><span class="count" id="count">01 / ${String(d.count).padStart(2,'0')}</span><button id="prev" aria-label="previous slide">‹</button><button id="next" aria-label="next slide">›</button></div>
<script>${DECK_JS}</script>
</body>
</html>`;
  }
  let r;
  if(pageKey==='home') r = fullHome(t);
  else if(pageKey==='process') r = fullProcess(t);
  else r = fullRecyc(t);
  return `<!DOCTYPE html>
<html lang="${L.hreflang}"${dirAttr}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${pageTitle(t,pageKey)}</title>
<meta name="description" content="${pageDesc(t,pageKey)}">
<link rel="canonical" href="${url(code,'full',pageKey)}">
${hreflangs('full',pageKey)}
<link rel="stylesheet" href="/site.css">
</head>
<body>
<a class="skip" href="#main">${t['chrome.skip']}</a>
${utilbar(t,code,'full',pageKey)}
${fullNav(t,code)}
<main id="main">
${r.body}
</main>
${footer(t,code,'full',pageKey)}
${r.scripts||''}
</body>
</html>`;
}

function shellAlt(code, variant, pageKey){
  const t = loadStrings(code);
  const L = LANGS.find(l=>l.code===code);
  const dirAttr = L.dir==='rtl' ? ' dir="rtl"' : '';
  let body;
  if(pageKey==='home') body = altHome(t);
  else if(pageKey==='process') body = altProcess(t);
  else if(pageKey==='recycling101') body = altRecyc(t);
  else body = altDeck(t);
  const nav = [['home','nav.home'],['process','nav.process'],['recycling101','nav.recycling101'],['deck','nav.deck']]
    .map(([p,k])=>`<a href="${url(code,variant,p)}">${t[k]}</a>`).join('');
  return `<!DOCTYPE html>
<html lang="${L.hreflang}" class="${VCLASS[variant]}"${dirAttr}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${pageTitle(t,pageKey)}</title>
<meta name="description" content="${pageDesc(t,pageKey)}">
<link rel="canonical" href="${url('en','full',pageKey)}">
${hreflangs(variant,pageKey)}
<link rel="stylesheet" href="/alt.css">
</head>
<body>
<a class="skip" href="#main">${t['chrome.skip']}</a>
<header class="topbar">
  <div class="wrap bar">
    <a class="brand" href="${url(code,variant,'home')}"><img src="/logo.svg" alt="Riposte Laboratories" width="100"><span>Laboratories&nbsp;Inc.</span></a>
    <div class="utility">${vswitch(t,code,variant,pageKey)}${langpick(t,code,variant,pageKey)}</div>
  </div>
  ${mtnote(t,code)}
</header>
<main id="main">
${body}
</main>
<footer>
  <div class="wrap">
    <div class="fnav"><nav class="pages" aria-label="Pages">${nav}</nav></div>
    <div class="cr">${t['footer.rights']} &#183; ${t['footer.loop']}</div>
  </div>
</footer>
</body>
</html>`;
}

/* ============================================================================
   emit
   ============================================================================ */
function write(file, html){
  fs.mkdirSync(path.dirname(file), {recursive:true});
  fs.writeFileSync(file, html);
}
const ORIGIN = 'https://ripostelabs.xyz';
function emitSitemap(){
  const urls = [];
  for(const p of PAGES){
    for(const L of LANGS){
      const alts = LANGS.map(l=>`    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${ORIGIN}${url(l.code,'full',p.key)}"/>`).join('\n')
        + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}${url('en','full',p.key)}"/>`;
      urls.push(`  <url>\n    <loc>${ORIGIN}${url(L.code,'full',p.key)}</loc>\n${alts}\n  </url>`);
    }
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n`+
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`+
    urls.join('\n')+`\n</urlset>\n`;
  fs.writeFileSync(path.join(ROOT,'sitemap.xml'), xml);
  console.log('wrote sitemap.xml:', urls.length, 'urls');
}
function main(){
  const only = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null; // optional single lang
  let n = 0;
  for(const L of LANGS){
    if(only && L.code !== only) continue;
    for(const p of PAGES){
      write(outPath(L.code,'full',p.key), shellFull(L.code, p.key)); n++;
      for(const v of ['mobile','lite','eink']){
        write(outPath(L.code,v,p.key), shellAlt(L.code, v, p.key)); n++;
      }
    }
    console.log('built', L.code);
  }
  if(!only) emitSitemap();
  console.log('done:', n, 'files');
}
main();

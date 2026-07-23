/* Multilingual hero tagline rendered on <canvas>, laid out with
   @chenglou/pretext (MIT). Canvas has no auto-layout, so text must be measured
   to be centred and fit; pretext measures cross-script width without touching
   the DOM. Decorative, aria-hidden, and degrades gracefully. */
import { prepare, measureNaturalWidth } from '/pretext/layout.js';
(function(){
  var canvas = document.getElementById('tagline');
  if(!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var PHRASES = [{"t":"Reclaimed material, re-engineered.","dir":"ltr"},{"t":"Matière récupérée, ré-ingénierée.","dir":"ltr"},{"t":"Material recuperado, rediseñado.","dir":"ltr"},{"t":"Materiale recuperato, re-ingegnerizzato.","dir":"ltr"},{"t":"回收材料，再造工程。","dir":"ltr"},{"t":"回収した素材を、再設計。","dir":"ltr"},{"t":"회수한 소재, 재설계하다.","dir":"ltr"},{"t":"مواد مُستردّة، مُعاد هندستها.","dir":"rtl"},{"t":"पुनःप्राप्त सामग्री, पुनःइंजीनियर की गई।","dir":"ltr"},{"t":"ਮੁੜ-ਪ੍ਰਾਪਤ ਸਮੱਗਰੀ, ਮੁੜ-ਇੰਜੀਨੀਅਰ ਕੀਤੀ।","dir":"ltr"},{"t":"Vật liệu tái chế, được tái chế tạo.","dir":"ltr"}];
  if(!PHRASES.length) return;
  var fam = getComputedStyle(document.body).fontFamily || 'monospace';
  var color = getComputedStyle(document.body).color || '#1d1a17';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var cssW = 0, cssH = 0, idx = 0, alpha = 0, phase = 'in', hold = 0, BASE = 100;
  function fontSizeFor(text){
    try{
      var w = measureNaturalWidth(prepare(text, BASE + 'px ' + fam));
      if(!(w > 0)) return null;
      return Math.max(11, Math.min(Math.min(30, cssH * 0.82), BASE * (cssW * 0.96) / w));
    }catch(e){ return null; }
  }
  function draw(a){
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    var ph = PHRASES[idx], fs = fontSizeFor(ph.t);
    if(fs == null) return;
    ctx.globalAlpha = Math.max(0, Math.min(1, a)) * 0.9;
    ctx.fillStyle = color;
    ctx.font = fs + 'px ' + fam;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    try{ ctx.direction = ph.dir || 'ltr'; }catch(e){}
    ctx.fillText(ph.t, cssW / 2, cssH / 2 + 1);
  }
  function resize(){
    cssW = canvas.clientWidth; cssH = canvas.clientHeight;
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    draw(alpha);
  }
  window.addEventListener('resize', resize);
  resize();
  if(reduced || PHRASES.length < 2){ alpha = 1; draw(1); return; }
  var prev = 0;
  function tick(ts){
    if(!prev) prev = ts; var dt = ts - prev; prev = ts;
    if(phase === 'in'){ alpha += dt / 500; if(alpha >= 1){ alpha = 1; phase = 'hold'; hold = ts + 2600; } }
    else if(phase === 'hold'){ if(ts >= hold) phase = 'out'; }
    else { alpha -= dt / 500; if(alpha <= 0){ alpha = 0; idx = (idx + 1) % PHRASES.length; phase = 'in'; } }
    draw(alpha);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

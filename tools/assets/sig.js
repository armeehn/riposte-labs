// Signal-wave hero animation: three colour sine "signals" over faint noise,
// amplitude-enveloped like a voice waveform.
(function(){
  var c = document.getElementById('sig');
  if(!c || !c.getContext) return;
  var ctx = c.getContext('2d');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var mark = document.querySelector('.hero .mark');
  var midY = 0;
  function resize(){
    c.width = c.offsetWidth * dpr;
    c.height = c.offsetHeight * dpr;
    // center the waveform on the logo so the signal runs behind the mark
    var cr = c.getBoundingClientRect(), mr = mark.getBoundingClientRect();
    midY = (mr.top + mr.height/2 - cr.top) * dpr;
  }
  window.addEventListener('resize', resize);
  resize();
  var SIGNALS = [
    {color:'#f0477d', freq:0.0080, speed:1.00, amp:52, lw:4.0},
    {color:'#fe9a0d', freq:0.0115, speed:1.35, amp:38, lw:3.4},
    {color:'#12b795', freq:0.0150, speed:0.75, amp:28, lw:3.0}
  ];
  var t = 0;
  function trace(pts){
    ctx.beginPath();
    for(var j=0;j<pts.length;j++){
      j ? ctx.lineTo(pts[j][0], pts[j][1]) : ctx.moveTo(pts[j][0], pts[j][1]);
    }
  }
  function draw(){
    var w = c.width, h = c.height, mid = midY || h * 0.4;
    ctx.clearRect(0,0,w,h);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    function env(x){ return Math.pow(Math.sin(Math.PI * (x/w)), 1.3); }
    // noise floor: faint, jittery bone-coloured traces
    ctx.globalAlpha = 0.45;
    for(var n=0;n<2;n++){
      var npts = [];
      for(var x=0;x<=w;x+=4*dpr){
        var y = mid + env(x) * (
          Math.sin(x*0.045/dpr + t*(2.1+n*0.7) + n*9) * 6 +
          Math.sin(x*0.013/dpr - t*1.6 + n*4)  * 11 +
          Math.sin(x*0.090/dpr + t*3.2)        * 2.5
        ) * dpr;
        npts.push([x,y]);
      }
      trace(npts);
      ctx.strokeStyle = 'rgba(29,26,23,0.30)'; ctx.lineWidth = 1.3*dpr; ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // signals: clean sines, breathing amplitude, ink underlay for contrast
    for(var i=0;i<SIGNALS.length;i++){
      var s = SIGNALS[i];
      var breathe = 0.65 + 0.35 * Math.sin(t*0.55 + i*2.3);
      var pts = [];
      for(var x=0;x<=w;x+=3*dpr){
        var y = mid + env(x) * Math.sin(x*s.freq/dpr + t*s.speed + i*2.1)
                * s.amp * breathe * dpr;
        pts.push([x,y]);
      }
      trace(pts); ctx.strokeStyle = '#1d1a17'; ctx.lineWidth = (s.lw+2.6)*dpr; ctx.stroke();
      trace(pts); ctx.strokeStyle = s.color;   ctx.lineWidth = s.lw*dpr;       ctx.stroke();
    }
    t += 0.022;
    if(!reduced) requestAnimationFrame(draw);
  }
  draw();
})();
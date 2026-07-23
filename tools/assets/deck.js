(function(){
  var deck=document.getElementById('deck');
  var slides=Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var count=document.getElementById('count');
  var prog=document.getElementById('prog');
  var total=slides.length, idx=0;
  function pad(n){return (n<10?'0':'')+n;}
  function update(){
    idx=Math.round(deck.scrollTop/window.innerHeight);
    if(idx<0)idx=0; if(idx>total-1)idx=total-1;
    count.textContent=pad(idx+1)+' / '+pad(total);
    prog.style.width=(total>1?(idx/(total-1))*100:0)+'%';
  }
  function go(i){
    i=Math.max(0,Math.min(total-1,i));
    slides[i].scrollIntoView({behavior:'smooth'});
  }
  deck.addEventListener('scroll',function(){window.requestAnimationFrame(update);},{passive:true});
  document.getElementById('next').addEventListener('click',function(){go(idx+1);});
  document.getElementById('prev').addEventListener('click',function(){go(idx-1);});
  document.addEventListener('keydown',function(e){
    // Don't hijack keys aimed at focused controls, or with modifiers held.
    var t=e.target;
    if(t&&(/^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(t.tagName)||t.isContentEditable))return;
    if(e.metaKey||e.ctrlKey||e.altKey)return;
    // Horizontal + paging keys change slides; Up/Down/Space/scroll stay native so
    // tall slides (e.g. at zoom) can be scrolled and focused controls still work.
    if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();go(idx+1);}
    else if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();go(idx-1);}
    else if(e.key==='Home'){e.preventDefault();go(0);}
    else if(e.key==='End'){e.preventDefault();go(total-1);}
  });
  update();
})();

const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
async function load(){
  try{const r=await fetch('/api/archive',{cache:'no-store'});if(r.ok)return await r.json();}catch(e){}
  const r=await fetch('/data/archive.json',{cache:'no-store'});return await r.json();
}
(async()=>{
 const app=document.querySelector('#archive-app');
 try{
   const items=await load();
   app.innerHTML=`<header class="archive-hero"><div class="eyebrow">Archivio storico</div><h1 style="font-size:64px">Rassegna Finanziaria</h1><p style="color:#5c6b7d;max-width:700px">Ogni edizione resta disponibile e consultabile per data.</p></header><div class="archive-list">${items.map(x=>`<a class="card archive-card" href="/?date=${encodeURIComponent(x.date)}"><div class="eyebrow">${esc(x.date_label)}</div><h3>${esc(x.title)}</h3><p>${esc(x.summary)}</p></a>`).join('')}</div>`;
 }catch(e){app.innerHTML=`<div class="card" style="padding:30px"><h2>Archivio non disponibile</h2></div>`}
 const toggle=document.querySelector('.mobile-toggle'),sidebar=document.querySelector('.sidebar');
 toggle?.addEventListener('click',()=>sidebar.classList.toggle('open'));
})();

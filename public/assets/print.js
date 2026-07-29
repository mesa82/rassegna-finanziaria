
const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const cls=d=>d==='down'?'down':d==='up'?'up':'neutral';
const links=arr=>(arr||[]).map(s=>{
  const external=String(s.url||'').startsWith('http');
  return `<a href="${esc(s.url||'#')}" ${external?'target="_blank" rel="noopener"':''}>${esc(s.name)}</a>`;
}).join(' · ');
const printSources=arr=>(arr&&arr.length)?`<div class="sources">Fonte: ${links(arr)}</div>`:'';
const lis=arr=>(arr||[]).map(x=>`<li>${esc(x)}</li>`).join('');
const heatClass=value=>{
  const v=Number(value||0);
  if(v>=5)return 'heat-pos-3'; if(v>=1)return 'heat-pos-2'; if(v>0.15)return 'heat-pos-1';
  if(v<=-5)return 'heat-neg-3'; if(v<=-1)return 'heat-neg-2'; if(v<-0.15)return 'heat-neg-1';
  return 'heat-flat';
};
const monitorPrint=section=>`<div class="monitor-print-block"><h3>${esc(section.name)}</h3><table class="monitor-print-table">
<thead><tr><th>Strumento</th><th>1W</th><th>1M</th><th>YTD</th></tr></thead>
<tbody>${(section.rows||[]).map(row=>`<tr><td>${esc(row.label)}<small>${esc(row.instrument)}</small>${printSources(row.sources)}</td><td class="${heatClass(row.one_week_value)}">${esc(row.one_week)}</td><td class="${heatClass(row.one_month_value)}">${esc(row.one_month)}</td><td class="${heatClass(row.ytd_value)}">${esc(row.ytd)}</td></tr>`).join('')}</tbody>
</table></div>`;

async function loadEdition(){
  const params=new URLSearchParams(location.search);
  const date=params.get('date');
  if(date){
    const r=await fetch(`/api/edition/${encodeURIComponent(date)}`,{cache:'no-store'});
    if(!r.ok) throw new Error('Edizione archivio non disponibile');
    return await r.json();
  }
  const r=await fetch('/api/latest',{cache:'no-store'});
  if(!r.ok) throw new Error('Rassegna non disponibile');
  return await r.json();
}

function render(d){
  const m=d.meta,r=d.market_regime,f=d.trading_focus;
  return `
  <header class="doc-header">
    <div>
      <div class="kicker">Daily Market Intelligence</div>
      <h1>Rassegna Finanziaria</h1>
      <div class="meta">${esc(m.date_label)} · ${esc(m.session)} · aggiornato ${esc(m.updated_at)}</div>${printSources(m.sources)}
    </div>
    <div class="edition"><span>EDIZIONE</span><strong>${esc(m.edition)}</strong><span>${esc(m.region)}</span></div>
  </header>

  <section class="print-section">
    <div class="section-title"><span class="num">01</span><h2>Market Regime</h2></div>
    <div class="regime-box">
      <div class="regime-main">
        <div class="kicker">Regime prevalente</div>
        <h3>${esc(r.label)}</h3>
        <p>${esc(r.summary)}</p>
        <div class="confirmations">${(r.confirmations||[]).map(x=>`<span>${esc(x)}</span>`).join('')}</div>${printSources(r.sources)}
      </div>
      <div class="verdict">
        <div class="kicker" style="color:#76d9cf">Verdetto operativo</div>
        <h3>${esc(r.verdict)}</h3>
        <p>${esc(r.verdict_summary)}</p>
        <div class="risk"><span>Rischio</span><strong>${esc(r.risk)}</strong></div>
      </div>
    </div>
    <div class="tiles">${(d.market_tiles||[]).map(x=>`<div class="tile"><div class="label">${esc(x.label)}</div><div class="value ${cls(x.direction)}">${esc(x.value)}</div>${printSources(x.sources)}</div>`).join('')}</div>
  </section>

  <section class="print-section page-break">
    <div class="section-title"><span class="num">02</span><h2>Top News</h2></div>
    ${(d.top_news||[]).map(n=>`<article class="news-item"><span class="tag">${esc(n.tag)}</span><h3>${esc(n.title)}</h3><p>${esc(n.summary)}</p><div class="why"><b>PERCHÉ CONTA</b><p>${esc(n.why)}</p></div><div class="sources">${links(n.sources)}</div></article>`).join('')}
  </section>

  <section class="print-section page-break">
    <div class="section-title"><span class="num">03</span><h2>Macro &amp; Rates</h2></div>
    <div class="macro-grid">
      <div class="lead-stat"><div class="kicker" style="color:#8fd4ff">${esc(d.macro_rates.lead_label)}</div><div class="value">${esc(d.macro_rates.lead_value)}</div><div style="font-size:7pt">${esc(d.macro_rates.lead_delta)}</div>${printSources(d.macro_rates.lead_sources || d.macro_rates.sources)}</div>
      <div class="macro-card">
        <h3>${esc(d.macro_rates.headline)}</h3>
        <p>${esc(d.macro_rates.summary)}</p>
        <div class="metrics">${(d.macro_rates.metrics||[]).map(x=>`<div class="metric"><span>${esc(x.label)}${printSources(x.sources)}</span><strong>${esc(x.value)}</strong></div>`).join('')}</div>
        <div class="sources">${links(d.macro_rates.sources)}</div>
      </div>
    </div>
    <h3 style="font:400 13pt Georgia,serif;margin:5mm 0 2mm">Prossimi catalyst</h3>
    <ul class="catalysts">${(d.catalysts||[]).map(x=>`<li><strong>${esc(x.date)}</strong><span><b>${esc(x.title)}</b><br>${esc(x.summary)}${printSources(x.sources)}</span></li>`).join('')}</ul>
  </section>

  <section class="print-section page-break">
    <div class="section-title"><span class="num">04</span><h2>Intermarket Dashboard</h2></div>
    <div class="summary-strip"><div><div class="label">USA · INDICI CASH</div><p>${esc(d.indices_summary.us)}</p>${printSources(d.indices_summary.us_sources)}</div><div><div class="label">EUROPA · CHIUSURA CASH</div><p>${esc(d.indices_summary.europe)}</p>${printSources(d.indices_summary.europe_sources)}</div></div>
    <table>
      <thead><tr><th>Indice</th><th>Livello / stato</th><th>Variazione</th></tr></thead>
      <tbody>${(d.indices||[]).map(x=>`<tr><td>${esc(x.name)}${printSources(x.sources)}</td><td>${esc(x.level)}</td><td class="${cls(x.direction)}">${esc(x.change)}</td></tr>`).join('')}</tbody>
    </table>
    <table>
      <thead><tr><th>Strumento</th><th>Valore</th><th>Variazione</th><th>Lettura</th></tr></thead>
      <tbody>${(d.intermarket||[]).map(x=>`<tr><td>${esc(x.name)}${printSources(x.sources)}</td><td>${esc(x.value)}</td><td class="${cls(x.direction)}">${esc(x.change)}</td><td>${esc(x.description)}</td></tr>`).join('')}</tbody>
    </table>
  </section>

  <section class="print-section page-break">
    <div class="section-title"><span class="num">05</span><h2>Weekly Market Monitor</h2></div>
    <p style="font-size:8pt;line-height:1.45">${esc(d.market_monitor.week_label)}. ${esc(d.market_monitor.methodology)}</p>
    ${printSources(d.market_monitor.sources)}
    <div class="monitor-print-grid">${(d.market_monitor.sections||[]).map(monitorPrint).join('')}</div>
  </section>

  <section class="print-section page-break">
    <div class="section-title"><span class="num">06</span><h2>Earnings Watch</h2></div>
    <div class="earnings-grid">${(d.earnings||[]).map(x=>`<article class="earning-card"><div class="earning-head"><strong>${esc(x.ticker)} <span style="font:8pt Arial">${esc(x.company)}</span></strong><span class="${cls(x.direction)}">${esc(x.headline_value)}</span></div><div class="kicker" style="margin-top:2mm">${esc(x.status)}</div><p>${esc(x.summary)}</p><div class="sources">${links(x.sources)}</div></article>`).join('')}</div>
    <div class="appointments"><b>PROSSIMI APPUNTAMENTI</b><br>${(d.appointments||[]).map(esc).join(' · ')}${printSources(d.appointments_sources)}</div>
  </section>

  <section class="print-section">
    <div class="section-title"><span class="num">07</span><h2>Key Movers</h2></div>
    <table>
      <thead><tr><th>Ticker</th><th>Movimento</th><th>Catalyst</th></tr></thead>
      <tbody>${(d.key_movers||[]).map(x=>`<tr><td>${esc(x.ticker)}</td><td class="${cls(x.direction)}">${esc(x.change)}</td><td>${esc(x.catalyst)}${printSources(x.sources)}</td></tr>`).join('')}</tbody>
    </table>
  </section>

  <section class="print-section page-break">
    <div class="section-title"><span class="num">08</span><h2>Trading Focus / What Matters Today</h2></div>
    <h3 style="font:400 15pt Georgia,serif;margin:0 0 4mm">${esc(f.headline)}</h3>
    <div class="focus-grid">
      <article class="focus-box bull"><div class="kicker">Scenario rialzista</div><h3>${esc(f.bull_title)}</h3><ul>${lis(f.bull_conditions)}</ul></article>
      <article class="focus-box bear"><div class="kicker" style="color:var(--red)">Scenario ribassista</div><h3>${esc(f.bear_title)}</h3><ul>${lis(f.bear_conditions)}</ul></article>
    </div>
    <div class="setup"><div class="kicker" style="color:#efb35e">Setup preferito</div><h3>${esc(f.setup_title)}</h3><p>${esc(f.setup_summary)}</p>${printSources(f.sources)}<div class="levels">${(f.levels||[]).map((x,i)=>`<div class="level">${String(i+1).padStart(2,'0')} · ${esc(x)}</div>`).join('')}</div></div>
    <div class="methodology" id="metodologia"><b>Fonti e metodologia.</b> ${esc(d.methodology)}</div>
  </section>`;
}

(async()=>{
  const app=document.querySelector('#print-app');
  try{
    const data=await loadEdition();
    app.innerHTML=render(data);
    document.title=`Rassegna Finanziaria — ${data.meta.date_label}`;
    const date=new URLSearchParams(location.search).get('date');
    document.querySelector('#back-link').href=date?`/?date=${encodeURIComponent(date)}`:'/';
    document.querySelector('#print-button').addEventListener('click',()=>window.print());
    if(new URLSearchParams(location.search).get('auto')==='1'){
      setTimeout(()=>window.print(),700);
    }
  }catch(error){
    app.innerHTML=`<h1>Documento non disponibile</h1><p>${esc(error.message)}</p>`;
  }
})();

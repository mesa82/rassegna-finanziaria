
const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const cls = d => d === 'down' ? 'neg' : d === 'up' ? 'pos' : '';
const sourceLinks = arr => (arr || []).map(s => {
  const href = esc(s.url || '#');
  const external = String(s.url || '').startsWith('http');
  return `<a href="${href}" ${external ? 'target="_blank" rel="noopener"' : ''}>${esc(s.name)} ↗</a>`;
}).join(' &nbsp; ');
const sourceLine = arr => (arr && arr.length) ? `<div class="data-source">FONTE · ${sourceLinks(arr)}</div>` : '';
const spark = values => {
  const vals = values || [20,15,18,13,16,12];
  const max = Math.max(...vals), min = Math.min(...vals), span = Math.max(1,max-min);
  const points = vals.map((v,i)=>`${i*(200/(vals.length-1))},${26-((v-min)/span)*20}`).join(' ');
  return `<svg viewBox="0 0 200 30"><polyline points="${points}" fill="none" stroke="#009b8b" stroke-width="2"/></svg>`;
};
const list = arr => (arr || []).map(x => `<li>${esc(x)}</li>`).join('');
const heatClass = value => {
  const v = Number(value || 0);
  if(v >= 5) return 'heat-pos-3';
  if(v >= 1) return 'heat-pos-2';
  if(v > 0.15) return 'heat-pos-1';
  if(v <= -5) return 'heat-neg-3';
  if(v <= -1) return 'heat-neg-2';
  if(v < -0.15) return 'heat-neg-1';
  return 'heat-flat';
};
const monitorTable = section => `<article class="card monitor-card ${section.rows.length > 5 ? 'monitor-wide' : ''}">
  <div class="monitor-title">${esc(section.name)}</div>
  <div class="monitor-head"><span>Strumento</span><span>1W</span><span>1M</span><span>YTD</span></div>
  ${(section.rows||[]).map(row=>`<div class="monitor-row">
    <div><strong>${esc(row.label)}</strong><small>${esc(row.instrument)}</small>${sourceLine(row.sources)}</div>
    <span class="${heatClass(row.one_week_value)}">${esc(row.one_week)}</span>
    <span class="${heatClass(row.one_month_value)}">${esc(row.one_month)}</span>
    <span class="${heatClass(row.ytd_value)}">${esc(row.ytd)}</span>
  </div>`).join('')}
</article>`;
const metricRows = arr => (arr || []).map(x => `<div class="metric-row"><span>${esc(x.label)}${sourceLine(x.sources)}</span><strong>${esc(x.value)}</strong></div>`).join('');

async function loadEdition(){
  const selectedDate = new URLSearchParams(location.search).get('date');
  if(selectedDate){
    const archived = await fetch(`/api/edition/${encodeURIComponent(selectedDate)}`, {cache:'no-store'});
    if(archived.ok) return await archived.json();
    throw new Error('Edizione archivio non disponibile');
  }
  try{
    const r = await fetch('/api/latest', {cache:'no-store'});
    if(r.ok) return await r.json();
  }catch(e){}
  const r = await fetch('/data/latest.json', {cache:'no-store'});
  if(!r.ok) throw new Error('Rassegna non disponibile');
  return await r.json();
}

function render(d){
  const r = d.market_regime, m = d.meta, f = d.trading_focus;
  document.title = `Rassegna Finanziaria — ${m.date_label}`;
  return `
  <header class="hero">
    <div>
      <div class="eyebrow">Daily Market Intelligence</div>
      <h1>Rassegna Finanziaria</h1>
      <div class="date-row">
        <span>${esc(m.date_label)}</span>
        <span class="pill">${esc(m.session)} · aggiornato ${esc(m.updated_at)}</span>
        <a class="refresh" href="/admin.html">Pubblica rassegna</a>
        ${sourceLine(m.sources)}
      </div>
    </div>
    <div class="edition"><span>EDIZIONE</span><strong>${esc(m.edition)}</strong><span>${esc(m.region)}</span></div>
  </header>

  <section id="regime" class="section">
    <div class="grid-regime">
      <article class="card regime-card">
        <div class="section-label"><span class="accent">01</span>Market Regime</div>
        <div class="regime-body">
          <div><div class="section-label"><span class="accent">●</span>Regime prevalente</div>
            <h2 class="regime-title">${esc(r.label).replace(' ','<br>')}</h2>
            <p class="regime-copy">${esc(r.summary)}</p>
          </div>
          <div class="gauge">
            <svg viewBox="0 0 220 120" aria-hidden="true">
              <path d="M20 100 A90 90 0 0 1 200 100" fill="none" stroke="#e5ded3" stroke-width="28"/>
              <path d="M20 100 A90 90 0 0 1 110 10" fill="none" stroke="#c96a5f" stroke-width="28"/>
              <path d="M110 10 A90 90 0 0 1 200 100" fill="none" stroke="#d4ece7" stroke-width="28"/>
              <line x1="110" y1="100" x2="${110 + Math.max(-55,Math.min(55,r.breadth_score))*0.35}" y2="44" stroke="#0b2342" stroke-width="4"/>
            </svg>
            <div class="value">${r.breadth_score > 0 ? '+' : ''}${esc(r.breadth_score)}</div><small>${esc(r.breadth_note)}</small>${sourceLine(r.sources)}
          </div>
        </div>
        <div class="confirm"><b>CONFERMA RICHIESTA</b>${(r.confirmations||[]).map(esc).join(' · ')}</div>
      </article>
      <aside class="card verdict"><div class="eyebrow">LIVE &nbsp; VERDETTO OPERATIVO</div><div class="arrow">→</div>
        <h3>${esc(r.verdict)}</h3><p>${esc(r.verdict_summary)}</p><div class="risk"><span>Rischio</span><strong>${esc(r.risk)}</strong></div>
      </aside>
    </div>
    <div class="card ticker-strip">${(d.market_tiles||[]).map(t=>`<div class="ticker"><div class="label">${esc(t.label)}</div><div class="big ${t.direction==='down'?'down':''}">${esc(t.value)}</div><div class="spark">${spark(t.spark)}</div>${sourceLine(t.sources)}</div>`).join('')}</div>
  </section>

  <section id="news" class="section">
    <div class="section-head"><div><div class="eyebrow">02 · Top News</div><h2>Le storie che guidano la seduta</h2></div><em>Dati intraday e lettura operativa</em></div>
    <div class="news-grid">${(d.top_news||[]).map(n=>`<article class="card news-card"><span class="tag">${esc(n.tag)}</span><h3>${esc(n.title)}</h3><p>${esc(n.summary)}</p><div class="why"><b>PERCHÉ CONTA</b><p>${esc(n.why)}</p></div><div class="source">${sourceLinks(n.sources)}</div></article>`).join('')}</div>
  </section>

  <section id="macro" class="section">
    <div class="section-head"><div><div class="eyebrow">03 · Macro &amp; Rates</div><h2>${esc(d.macro_rates.headline)}</h2></div></div>
    <div class="macro-grid">
      <article class="card macro-main"><div class="macro-stat"><div class="eyebrow" style="color:#79c8ff">${esc(d.macro_rates.lead_label)}</div><div><div class="big">${esc(d.macro_rates.lead_value)}</div><small>${esc(d.macro_rates.lead_delta)}</small>${sourceLine(d.macro_rates.lead_sources || d.macro_rates.sources)}</div></div>
      <div class="macro-copy"><p>${esc(d.macro_rates.summary)}</p>${metricRows(d.macro_rates.metrics)}<div class="source">${sourceLinks(d.macro_rates.sources)}</div></div></article>
      <aside class="card timeline"><h3>Prossimi catalyst</h3>${(d.catalysts||[]).map(c=>`<div class="timeline-item"><b>${esc(c.date)}</b><span class="dot"></span><div><strong>${esc(c.title)}</strong><br><small>${esc(c.summary)}</small>${sourceLine(c.sources)}</div></div>`).join('')}</aside>
    </div>
  </section>

  <section id="intermarket" class="section">
    <div class="section-head"><div><div class="eyebrow">04 · Intermarket Dashboard</div><h2>Indici, tassi, valute e commodity</h2></div></div>
    <div class="card market-summary"><div><div class="eyebrow" style="color:var(--amber)">WALL STREET · INDICI CASH</div><h3>${esc(d.indices_summary.us)}</h3>${sourceLine(d.indices_summary.us_sources)}</div><div><div class="eyebrow" style="color:var(--amber)">EUROPA · INDICI CASH</div><h3>${esc(d.indices_summary.europe)}</h3>${sourceLine(d.indices_summary.europe_sources)}</div></div>
    <div class="card table"><div class="table-header"><div>Indice</div><div>Livello / stato</div><div>Variazione</div></div>${(d.indices||[]).map(x=>`<div class="table-row"><div class="name">${esc(x.name)}${sourceLine(x.sources)}</div><div>${esc(x.level)}</div><div class="${cls(x.direction)}">${esc(x.change)}</div></div>`).join('')}</div>
    <div class="card inter-list">${(d.intermarket||[]).map((x,i)=>`<div class="inter-row"><div class="idx">${String(i+1).padStart(2,'0')}</div><div><div class="instrument">${esc(x.name)}</div><div class="desc">${esc(x.description)}</div>${sourceLine(x.sources)}</div><div class="value">${esc(x.value)}</div><div class="${cls(x.direction)}">${esc(x.change)}</div></div>`).join('')}</div>
  </section>

  <section id="monitor" class="section">
    <div class="section-head"><div><div class="eyebrow">05 · Weekly Market Monitor</div><h2>${esc(d.market_monitor.title)}</h2></div><em>${esc(d.market_monitor.week_label)}</em></div>
    <div class="card monitor-intro"><div><strong>${esc(d.market_monitor.week_label)}</strong><p>${esc(d.market_monitor.methodology)}</p></div>${sourceLine(d.market_monitor.sources)}</div>
    <div class="monitor-grid">${(d.market_monitor.sections||[]).map(monitorTable).join('')}</div>
  </section>

  <section id="earnings" class="section">
    <div class="section-head"><div><div class="eyebrow">06 · Earnings Watch</div><h2>Trimestrali e guidance da monitorare</h2></div></div>
    <div class="earnings-grid">${(d.earnings||[]).map(e=>`<article class="card earning"><div><div class="ticker-symbol">${esc(e.ticker)} <small style="font-family:Arial;font-size:11px">${esc(e.company)}</small></div><div class="source">${esc(e.status)} · ${sourceLinks(e.sources)}</div></div><div><div class="move ${cls(e.direction)}">${esc(e.headline_value)}</div><p style="font-size:10px">${esc(e.summary)}</p></div></article>`).join('')}</div>
    <div class="appointments"><b style="color:var(--amber);letter-spacing:.15em;margin-right:20px">PROSSIMI APPUNTAMENTI</b>${(d.appointments||[]).map(esc).join(' · ')}${sourceLine(d.appointments_sources)}</div>
  </section>

  <section id="movers" class="section">
    <div class="section-head"><div><div class="eyebrow">07 · Key Movers</div><h2>Titoli e catalyst della seduta</h2></div></div>
    <div class="card table"><div class="table-header"><div>Ticker</div><div>Movimento</div><div>Catalyst</div></div>${(d.key_movers||[]).map(x=>`<div class="table-row"><div class="name">${esc(x.ticker)}</div><div class="${cls(x.direction)}">${esc(x.change)}</div><div>${esc(x.catalyst)}${sourceLine(x.sources)}</div></div>`).join('')}</div>
  </section>

  <section id="focus" class="section">
    <div class="section-head"><div><div class="eyebrow">08 · Trading Focus</div><h2>${esc(f.headline)}</h2></div><em>Playbook intraday</em></div>
    <div class="focus-grid"><article class="card scenario bull"><div class="eyebrow">Scenario rialzista</div><h3>${esc(f.bull_title)}</h3><ul class="checklist">${list(f.bull_conditions)}</ul></article><article class="card scenario bear"><div class="eyebrow" style="color:var(--red)">Scenario ribassista</div><h3>${esc(f.bear_title)}</h3><ul class="checklist">${list(f.bear_conditions)}</ul></article></div>
    <div class="card setup"><div><div class="eyebrow" style="color:#efad49">Setup preferito</div><h3>${esc(f.setup_title)}</h3><p>${esc(f.setup_summary)}</p>${sourceLine(f.sources)}</div><div class="levels">${(f.levels||[]).map((x,i)=>`<div class="level">${String(i+1).padStart(2,'0')} &nbsp; ${esc(x)}</div>`).join('')}</div></div>
    <div class="card method" id="metodologia"><div><div class="eyebrow">Fonti &amp; metodologia</div><h3>Dati verificabili, lettura editoriale</h3><p>${esc(d.methodology)}</p></div></div>
    <div class="pdfbar"><div><div class="eyebrow" style="color:#efad49">Documento completo</div><p style="font-family:Georgia,serif;font-style:italic;margin:8px 0 0">Apre una versione A4 ottimizzata per stampa e PDF.</p></div><a class="pdf-button" href="/stampa.html?date=${encodeURIComponent(m.date)}&auto=1" target="_blank" rel="noopener">↓ &nbsp; Esporta in PDF</a></div>
  </section>`;
}


(async()=>{
  const app = document.querySelector('#app');
  try{
    const data = await loadEdition();
    app.innerHTML = render(data);
  }catch(e){ app.innerHTML = `<div class="card" style="padding:30px"><h2>Rassegna non disponibile</h2><p>${esc(e.message)}</p></div>`; }
  const toggle=document.querySelector('.mobile-toggle'),sidebar=document.querySelector('.sidebar');
  toggle?.addEventListener('click',()=>sidebar.classList.toggle('open'));
  sidebar?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>sidebar.classList.remove('open')));
})();

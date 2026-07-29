
const tokenInput = document.querySelector('#admin-token');
const jsonInput = document.querySelector('#json-input');
const message = document.querySelector('#validation-result');
const publishButton = document.querySelector('#publish-button');

function showMessage(text, type='info'){
  message.textContent = text;
  message.className = `admin-message ${type}`;
}

function extractJson(text){
  let value = String(text || '').trim();
  value = value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const first = value.indexOf('{');
  const last = value.lastIndexOf('}');
  if(first < 0 || last < first) throw new Error('Non trovo un oggetto JSON valido.');
  return value.slice(first, last + 1);
}

function parseEdition(){
  const raw = extractJson(jsonInput.value);
  const edition = JSON.parse(raw);
  const required = [
    'meta','market_regime','market_tiles','top_news','macro_rates','catalysts',
    'indices_summary','indices','intermarket','market_monitor','earnings','appointments',
    'key_movers','trading_focus','methodology'
  ];
  for(const key of required){
    if(!(key in edition)) throw new Error(`Manca la sezione: ${key}`);
  }
  if(!edition.meta?.date || !/^\d{4}-\d{2}-\d{2}$/.test(edition.meta.date)){
    throw new Error('meta.date deve essere nel formato YYYY-MM-DD.');
  }

  const validSources = sources =>
    Array.isArray(sources) &&
    sources.length > 0 &&
    sources.every(source => source?.name?.trim() && source?.url?.trim());

  const requireSources = (sources, label) => {
    if(!validSources(sources)) throw new Error(`Manca una fonte specifica per: ${label}`);
  };

  requireSources(edition.meta.sources, 'data, orario e sessione');
  requireSources(edition.market_regime.sources, 'Market Regime e breadth score');
  edition.market_tiles.forEach((x,i)=>requireSources(x.sources, `market_tiles[${i}]`));
  edition.top_news.forEach((x,i)=>requireSources(x.sources, `top_news[${i}]`));
  requireSources(edition.macro_rates.lead_sources || edition.macro_rates.sources, 'valore principale Macro & Rates');
  edition.macro_rates.metrics.forEach((x,i)=>requireSources(x.sources, `macro_rates.metrics[${i}]`));
  edition.catalysts.forEach((x,i)=>requireSources(x.sources, `catalysts[${i}]`));
  requireSources(edition.indices_summary.us_sources, 'riepilogo indici USA');
  requireSources(edition.indices_summary.europe_sources, 'riepilogo indici Europa');
  edition.indices.forEach((x,i)=>requireSources(x.sources, `indices[${i}]`));
  edition.intermarket.forEach((x,i)=>requireSources(x.sources, `intermarket[${i}]`));
  edition.earnings.forEach((x,i)=>requireSources(x.sources, `earnings[${i}]`));
  requireSources(edition.appointments_sources, 'calendario appuntamenti');
  edition.key_movers.forEach((x,i)=>requireSources(x.sources, `key_movers[${i}]`));
  if(!edition.market_monitor || !Array.isArray(edition.market_monitor.sections)){
    throw new Error('market_monitor incompleto.');
  }
  if(!Array.isArray(edition.market_monitor.sources)){
    throw new Error('market_monitor.sources deve essere un array.');
  }
  const isNd = value => String(value ?? '').trim().toUpperCase() === 'ND';
  const validateMonitorValue = (row,textKey,numericKey,label) => {
    if(isNd(row[textKey])){
      if(row[numericKey] !== null) throw new Error(`${label}: con ND, ${numericKey} deve essere null.`);
      return false;
    }
    if(typeof row[numericKey] !== 'number' || !Number.isFinite(row[numericKey])){
      throw new Error(`${label}: ${numericKey} deve essere numerico oppure null con valore ND.`);
    }
    return true;
  };
  edition.market_monitor.sections.forEach((section,si)=>{
    if(!Array.isArray(section.rows)) throw new Error(`market_monitor.sections[${si}].rows deve essere un array.`);
    section.rows.forEach((row,ri)=>{
      const label=`market_monitor.sections[${si}].rows[${ri}]`;
      const hasData=[
        validateMonitorValue(row,'one_week','one_week_value',`${label}.one_week`),
        validateMonitorValue(row,'one_month','one_month_value',`${label}.one_month`),
        validateMonitorValue(row,'ytd','ytd_value',`${label}.ytd`)
      ].some(Boolean);
      if(!Array.isArray(row.sources)) throw new Error(`${label}.sources deve essere un array.`);
      if(hasData) requireSources(row.sources,label);
    });
  });
  requireSources(edition.trading_focus.sources, 'livelli operativi e Trading Focus');

  return edition;
}

document.querySelector('#format-json').addEventListener('click',()=>{
  try{
    const edition = parseEdition();
    jsonInput.value = JSON.stringify(edition, null, 2);
    showMessage(`JSON valido — edizione ${edition.meta.date_label || edition.meta.date}.`, 'success');
  }catch(error){
    showMessage(error.message, 'error');
  }
});

document.querySelector('#load-example').addEventListener('click', async()=>{
  try{
    const response = await fetch('/data/latest.json', {cache:'no-store'});
    const edition = await response.json();
    jsonInput.value = JSON.stringify(edition, null, 2);
    showMessage('Esempio caricato. Non pubblicarlo come rassegna reale.', 'info');
  }catch(error){
    showMessage('Impossibile caricare l’esempio.', 'error');
  }
});

publishButton.addEventListener('click', async()=>{
  const token = tokenInput.value.trim();
  if(!token){
    showMessage('Inserisci il token amministratore.', 'error');
    return;
  }

  let edition;
  try{
    edition = parseEdition();
  }catch(error){
    showMessage(error.message, 'error');
    return;
  }

  const confirmed = confirm(`Pubblicare e archiviare l’edizione ${edition.meta.date_label || edition.meta.date}?`);
  if(!confirmed) return;

  publishButton.disabled = true;
  publishButton.textContent = 'Pubblicazione…';
  showMessage('Invio dei dati a Cloudflare KV…', 'info');

  try{
    const response = await fetch('/api/publish', {
      method:'POST',
      headers:{
        'content-type':'application/json',
        'x-admin-token':token
      },
      body:JSON.stringify(edition)
    });
    const payload = await response.json();
    if(!response.ok) throw new Error(payload.error || 'Pubblicazione non riuscita.');
    showMessage(`Rassegna ${payload.date} pubblicata e archiviata. Apertura della dashboard…`, 'success');
    tokenInput.value = '';
    setTimeout(()=>location.href='/', 1200);
  }catch(error){
    showMessage(error.message, 'error');
    publishButton.disabled = false;
    publishButton.textContent = 'Pubblica e archivia';
  }
});

const toggle=document.querySelector('.mobile-toggle');
const sidebar=document.querySelector('.sidebar');
toggle?.addEventListener('click',()=>sidebar.classList.toggle('open'));

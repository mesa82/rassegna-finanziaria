
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
    'indices_summary','indices','intermarket','earnings','appointments',
    'key_movers','trading_focus','methodology'
  ];
  for(const key of required){
    if(!(key in edition)) throw new Error(`Manca la sezione: ${key}`);
  }
  if(!edition.meta?.date || !/^\d{4}-\d{2}-\d{2}$/.test(edition.meta.date)){
    throw new Error('meta.date deve essere nel formato YYYY-MM-DD.');
  }
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

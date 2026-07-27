
const PROMPT = "Genera la rassegna finanziaria di oggi in italiano con questo schema fisso da dashboard:\n1. Market Regime\n2. Top News\n3. Macro & Rates\n4. Intermarket Dashboard\n5. Earnings Watch\n6. Key Movers\n7. Trading Focus / What Matters Today\n\nMantieni un livello di dettaglio completo, non compatto. Tono pratico, orientato all’interpretazione di mercato.\nUsa la ricerca web per dati e notizie aggiornati. Dai priorità a fonti istituzionali, borse, banche centrali, Investor Relations e agenzie affidabili.\nIndica sempre l’orario dei dati di mercato e non mescolare future, indici cash e chiusure.\nNon inventare valori: se un dato non è verificabile, usa una formulazione prudente.\nRestituisci esclusivamente il JSON conforme allo schema richiesto.";
const SCHEMA = {"type": "object", "additionalProperties": false, "required": ["meta", "market_regime", "market_tiles", "top_news", "macro_rates", "catalysts", "indices_summary", "indices", "intermarket", "earnings", "appointments", "key_movers", "trading_focus", "methodology"], "properties": {"meta": {"type": "object", "additionalProperties": false, "required": ["date", "date_label", "edition", "region", "updated_at", "session"], "properties": {"date": {"type": "string"}, "date_label": {"type": "string"}, "edition": {"type": "string"}, "region": {"type": "string"}, "updated_at": {"type": "string"}, "session": {"type": "string"}}}, "market_regime": {"type": "object", "additionalProperties": false, "required": ["label", "summary", "breadth_score", "breadth_note", "verdict", "verdict_summary", "risk", "confirmations"], "properties": {"label": {"type": "string"}, "summary": {"type": "string"}, "breadth_score": {"type": "integer"}, "breadth_note": {"type": "string"}, "verdict": {"type": "string"}, "verdict_summary": {"type": "string"}, "risk": {"type": "string"}, "confirmations": {"type": "array", "items": {"type": "string"}}}}, "market_tiles": {"type": "array", "items": {"type": "object", "additionalProperties": false, "required": ["label", "value", "direction", "spark"], "properties": {"label": {"type": "string"}, "value": {"type": "string"}, "direction": {"type": "string", "enum": ["up", "down", "neutral"]}, "spark": {"type": "array", "items": {"type": "number"}}}}}, "top_news": {"type": "array", "items": {"type": "object", "additionalProperties": false, "required": ["tag", "title", "summary", "why", "sources"], "properties": {"tag": {"type": "string"}, "title": {"type": "string"}, "summary": {"type": "string"}, "why": {"type": "string"}, "sources": {"type": "array", "items": {"type": "object", "additionalProperties": false, "required": ["name", "url"], "properties": {"name": {"type": "string"}, "url": {"type": "string"}}}}}}}, "macro_rates": {"type": "object", "additionalProperties": false, "required": ["headline", "lead_label", "lead_value", "lead_delta", "summary", "metrics", "sources"], "properties": {"headline": {"type": "string"}, "lead_label": {"type": "string"}, "lead_value": {"type": "string"}, "lead_delta": {"type": "string"}, "summary": {"type": "string"}, "metrics": {"type": "array", "items": {"type": "object", "additionalProperties": false, "required": ["label", "value"], "properties": {"label": {"type": "string"}, "value": {"type": "string"}}}}, "sources": {"type": "array", "items": {"type": "object", "additionalProperties": false, "required": ["name", "url"], "properties": {"name": {"type": "string"}, "url": {"type": "string"}}}}}}, "catalysts": {"type": "array", "items": {"type": "object", "additionalProperties": false, "required": ["date", "title", "summary"], "properties": {"date": {"type": "string"}, "title": {"type": "string"}, "summary": {"type": "string"}}}}, "indices_summary": {"type": "object", "additionalProperties": false, "required": ["us", "europe"], "properties": {"us": {"type": "string"}, "europe": {"type": "string"}}}, "indices": {"type": "array", "items": {"type": "object", "additionalProperties": false, "required": ["name", "level", "change", "direction"], "properties": {"name": {"type": "string"}, "level": {"type": "string"}, "change": {"type": "string"}, "direction": {"type": "string", "enum": ["up", "down", "neutral"]}}}}, "intermarket": {"type": "array", "items": {"type": "object", "additionalProperties": false, "required": ["name", "description", "value", "change", "direction"], "properties": {"name": {"type": "string"}, "description": {"type": "string"}, "value": {"type": "string"}, "change": {"type": "string"}, "direction": {"type": "string", "enum": ["up", "down", "neutral"]}}}}, "earnings": {"type": "array", "items": {"type": "object", "additionalProperties": false, "required": ["ticker", "company", "status", "headline_value", "direction", "summary", "sources"], "properties": {"ticker": {"type": "string"}, "company": {"type": "string"}, "status": {"type": "string"}, "headline_value": {"type": "string"}, "direction": {"type": "string", "enum": ["up", "down", "neutral"]}, "summary": {"type": "string"}, "sources": {"type": "array", "items": {"type": "object", "additionalProperties": false, "required": ["name", "url"], "properties": {"name": {"type": "string"}, "url": {"type": "string"}}}}}}}, "appointments": {"type": "array", "items": {"type": "string"}}, "key_movers": {"type": "array", "items": {"type": "object", "additionalProperties": false, "required": ["ticker", "change", "direction", "catalyst"], "properties": {"ticker": {"type": "string"}, "change": {"type": "string"}, "direction": {"type": "string", "enum": ["up", "down", "neutral"]}, "catalyst": {"type": "string"}}}}, "trading_focus": {"type": "object", "additionalProperties": false, "required": ["headline", "bull_title", "bull_conditions", "bear_title", "bear_conditions", "setup_title", "setup_summary", "levels"], "properties": {"headline": {"type": "string"}, "bull_title": {"type": "string"}, "bull_conditions": {"type": "array", "items": {"type": "string"}}, "bear_title": {"type": "string"}, "bear_conditions": {"type": "array", "items": {"type": "string"}}, "setup_title": {"type": "string"}, "setup_summary": {"type": "string"}, "levels": {"type": "array", "items": {"type": "string"}}}}, "methodology": {"type": "string"}}};

const jsonResponse = (data, status=200) => new Response(JSON.stringify(data), {
  status,
  headers: {'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
});

function romeParts(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone:'Europe/Rome', year:'numeric', month:'2-digit', day:'2-digit',
    hour:'2-digit', minute:'2-digit', hourCycle:'h23'
  }).formatToParts(date);
  return Object.fromEntries(parts.map(p=>[p.type,p.value]));
}

function dateKey(parts) { return `${parts.year}-${parts.month}-${parts.day}`; }

async function callOpenAI(env) {
  if(!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY non configurata');
  const body = {
    model: env.OPENAI_MODEL || 'gpt-5-mini',
    tools: [{type:'web_search'}],
    input: PROMPT,
    text: {
      format: {
        type:'json_schema',
        name:'rassegna_finanziaria',
        strict:true,
        schema: SCHEMA
      }
    },
    store:false
  };
  const res = await fetch('https://api.openai.com/v1/responses', {
    method:'POST',
    headers:{'authorization':`Bearer ${env.OPENAI_API_KEY}`,'content-type':'application/json'},
    body:JSON.stringify(body)
  });
  const payload = await res.json();
  if(!res.ok) throw new Error(payload?.error?.message || 'Errore OpenAI API');
  const text = payload.output_text || payload.output?.flatMap(x=>x.content||[]).find(x=>x.type==='output_text')?.text;
  if(!text) throw new Error('Risposta OpenAI priva di output JSON');
  return JSON.parse(text);
}

async function saveEdition(env, edition) {
  if(!env.RASSEGNA_DATA) throw new Error('Binding KV RASSEGNA_DATA non configurato');
  const date = edition.meta.date;
  await env.RASSEGNA_DATA.put('latest', JSON.stringify(edition));
  await env.RASSEGNA_DATA.put(`edition:${date}`, JSON.stringify(edition));
  const current = await env.RASSEGNA_DATA.get('archive', 'json') || [];
  const entry = {
    date,
    date_label: edition.meta.date_label,
    title: edition.market_regime.label,
    summary: edition.market_regime.summary
  };
  const archive = [entry, ...current.filter(x=>x.date!==date)].slice(0, 3650);
  await env.RASSEGNA_DATA.put('archive', JSON.stringify(archive));
  await env.RASSEGNA_DATA.put(`last_run:${date}`, new Date().toISOString());
  return edition;
}

async function generateAndSave(env) {
  const edition = await callOpenAI(env);
  return saveEdition(env, edition);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if(url.pathname === '/api/latest') {
      if(env.RASSEGNA_DATA) {
        const data = await env.RASSEGNA_DATA.get('latest', 'json');
        if(data) return jsonResponse(data);
      }
      return env.ASSETS.fetch(new Request(new URL('/data/latest.json', url), request));
    }

    if(url.pathname === '/api/archive') {
      if(env.RASSEGNA_DATA) {
        const data = await env.RASSEGNA_DATA.get('archive', 'json');
        if(data) return jsonResponse(data);
      }
      return env.ASSETS.fetch(new Request(new URL('/data/archive.json', url), request));
    }

    if(url.pathname.startsWith('/api/edition/')) {
      const date = url.pathname.split('/').pop();
      if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) return jsonResponse({error:'Data non valida'},400);
      const data = env.RASSEGNA_DATA ? await env.RASSEGNA_DATA.get(`edition:${date}`, 'json') : null;
      return data ? jsonResponse(data) : jsonResponse({error:'Edizione non trovata'},404);
    }

    if(url.pathname === '/api/refresh' && request.method === 'POST') {
      if(!env.ADMIN_TOKEN || request.headers.get('x-admin-token') !== env.ADMIN_TOKEN) {
        return jsonResponse({error:'Non autorizzato'},401);
      }
      try { return jsonResponse(await generateAndSave(env)); }
      catch(e) { console.error(e); return jsonResponse({error:e.message},500); }
    }

    return env.ASSETS.fetch(request);
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil((async()=>{
      const p = romeParts(new Date(controller.scheduledTime));
      if(p.hour !== '13') return;
      const key = dateKey(p);
      if(!env.RASSEGNA_DATA) { console.error('Binding KV mancante'); return; }
      if(await env.RASSEGNA_DATA.get(`last_run:${key}`)) return;
      try { await generateAndSave(env); }
      catch(e) { console.error('Generazione programmata fallita:', e); }
    })());
  }
};

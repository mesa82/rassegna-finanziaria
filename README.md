# Rassegna Finanziaria V2

Dashboard dinamica su Cloudflare Workers con:

- sito statico servito dagli Assets di Workers;
- dati correnti e archivio salvati in Workers KV;
- aggiornamento automatico alle 13:00 Europe/Rome;
- generazione tramite OpenAI Responses API con ricerca web;
- aggiornamento manuale protetto da token;
- fallback sui dati dimostrativi inclusi nel repository.

## Caricamento su GitHub

Sostituire il contenuto del repository con **tutti i file e le cartelle** di questo pacchetto.

## Configurazioni Cloudflare richieste dopo il deploy

1. Creare un namespace Workers KV, ad esempio `rassegna-finanziaria-data`.
2. Nel Worker aprire **Binding** e aggiungere il namespace con nome binding:
   `RASSEGNA_DATA`
3. In **Impostazioni → Variabili e segreti** aggiungere:
   - segreto `OPENAI_API_KEY`
   - segreto `ADMIN_TOKEN`
   - variabile facoltativa `OPENAI_MODEL` (default: `gpt-5-mini`)
4. Ridistribuire il Worker.
5. Verificare i Cron Trigger: sono definiti nel file `wrangler.jsonc`.

## Perché due orari Cron

Cloudflare esegue i Cron Trigger in UTC. Il Worker è pianificato sia alle 11:00 sia alle 12:00 UTC e controlla l’ora locale `Europe/Rome`. In questo modo genera una sola volta quando a Roma sono le 13:00, gestendo automaticamente ora solare e ora legale.

## Nota sui costi

ChatGPT Plus non include l’utilizzo dell’API. La generazione automatica richiede un account OpenAI API con fatturazione attiva.

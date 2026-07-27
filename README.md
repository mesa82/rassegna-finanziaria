# Rassegna Finanziaria V3 — pubblicazione manuale gratuita

Questa versione non usa l'API OpenAI.

## Flusso quotidiano

1. Alle 13:00 l'automazione ChatGPT genera la rassegna completa.
2. Alla fine della risposta compare il blocco `DASHBOARD_JSON`.
3. Aprire `https://rassegna-finanziaria.mesa82.workers.dev/admin.html`.
4. Incollare il JSON, inserire `ADMIN_TOKEN` e premere **Pubblica e archivia**.
5. Il Worker salva:
   - `latest` per la homepage;
   - `edition:YYYY-MM-DD` per l'edizione giornaliera;
   - `archive` per l'indice storico.

## Configurazione Cloudflare richiesta

Il Worker deve avere:

- Binding Assets: `ASSETS`
- Binding KV: `RASSEGNA_DATA`
- Segreto: `ADMIN_TOKEN`

Non serve `OPENAI_API_KEY`.

## Aggiornamento del repository

Caricare nella radice del repository:

- `public/`
- `worker.js`
- `wrangler.jsonc`
- `package.json`
- `README.md`

Dopo il deploy controllare la scheda **Binding**. Se il binding KV non fosse più presente, ricollegare:

- Nome variabile: `RASSEGNA_DATA`
- Namespace: `rassegna-finanziaria-data`

## Sicurezza

La pagina `admin.html` è pubblicamente raggiungibile, ma non può pubblicare nulla senza il segreto `ADMIN_TOKEN`.
Il token non viene memorizzato dal browser.


## Esportazione PDF V4

Il pulsante **Esporta in PDF** apre `/stampa.html`, una vista A4 dedicata con:

- sidebar rimossa;
- tipografia e tabelle ottimizzate;
- sezioni distribuite su pagine leggibili;
- righe delle tabelle non spezzate;
- intestazioni delle tabelle ripetute quando possibile;
- collegamento automatico all'edizione corrente o archiviata.

Nella finestra di stampa del browser usare:

- Destinazione: `Salva come PDF`
- Formato carta: `A4`
- Orientamento: `Verticale`
- Scala: `100`
- Margini: `Predefiniti`
- Grafica di sfondo: attiva
- Intestazioni e piè di pagina del browser: disattivati


## Binding KV permanente — V5

Il file `wrangler.jsonc` contiene ora il collegamento permanente:

```json
"kv_namespaces": [
  {
    "binding": "RASSEGNA_DATA",
    "id": "14214b986f654ad4aefa4be172cc5d91"
  }
]
```

Da questo momento i deploy eseguiti dal repository GitHub manterranno il binding
`RASSEGNA_DATA` verso il namespace `rassegna-finanziaria-data`.

Il segreto `ADMIN_TOKEN` resta configurato esclusivamente nella dashboard Cloudflare
e non deve essere inserito nel repository.


## Copertura obbligatoria delle fonti — V6

La V6 mantiene il layout esistente e aggiunge soltanto collegamenti fonte compatti
accanto ai dati numerici.

Il pannello di pubblicazione rifiuta un JSON quando manca una fonte specifica per:

- data, orario e sessione;
- Market Regime e breadth score;
- ciascun riquadro mercato;
- ciascun dato Macro & Rates;
- ciascun catalyst con data;
- riepiloghi e righe degli indici;
- ciascun dato intermarket;
- earnings e movimenti dei titoli;
- calendario degli appuntamenti;
- livelli del Trading Focus.

La fonte generica a fine sezione non è più sufficiente. Ogni oggetto numerico deve
contenere `sources: [{"name":"...","url":"..."}]`.

Per i livelli operativi e il breadth score è ammessa una fonte denominata
`Elaborazione Rassegna Finanziaria`, collegata a `#metodologia`, insieme alle fonti
dei dati di mercato sottostanti.

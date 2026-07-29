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


## Weekly Market Monitor — V7

La V7 aggiunge la sezione `market_monitor` dopo Intermarket Dashboard.

Regole:
- utilizza soltanto l'ultima settimana completa;
- 1W, 1M e YTD sono distinti;
- ogni riga dichiara lo strumento o proxy;
- ogni riga contiene fonti obbligatorie;
- la sezione è inclusa anche nella stampa PDF;
- il pannello di pubblicazione rifiuta JSON senza `market_monitor`.

Per la prima integrazione i valori al 24/07/2026 sono stati importati dal prospetto
fornito dall'utente, salvato come `/public/assets/market-monitor-2026-07-24.png`.


## Correzione V7.1

Corretto il validatore server in `worker.js`.

`market_monitor` è un oggetto con la proprietà `sections`, non un array.
La V7 lo classificava erroneamente tra le sezioni top-level che devono essere array,
generando l'errore:

`market_monitor deve essere un array.`

Il JSON V7 già prodotto resta valido e non deve essere modificato.

## Leggibilità — V7.2

La V7.2 aumenta il testo ordinario della dashboard nell'intervallo 15–20 px.
Nel Weekly Market Monitor, valori, nomi degli strumenti e descrizioni dei proxy
sono tutti impostati a 15 px. La versione PDF conserva la precedente impaginazione A4.


## Correzione fonti Market Monitor — V7.3

- Il prospetto grafico fornito dall'utente è soltanto un riferimento di layout.
- Il file immagine non è più incluso né citato come fonte dati.
- Ogni valore numerico 1W, 1M e YTD richiede fonti specifiche e verificabili.
- Se un valore non è verificabile, il testo deve essere `ND` e il campo numerico `null`.
- Le righe interamente `ND` possono avere `sources: []`.
- Le celle `ND` sono visualizzate con uno stile neutro distinto dallo zero.

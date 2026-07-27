
const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function validateEdition(edition) {
  const requiredTop = [
    "meta",
    "market_regime",
    "market_tiles",
    "top_news",
    "macro_rates",
    "catalysts",
    "indices_summary",
    "indices",
    "intermarket",
    "earnings",
    "appointments",
    "key_movers",
    "trading_focus",
    "methodology",
  ];

  if (!edition || typeof edition !== "object" || Array.isArray(edition)) {
    throw new Error("Il contenuto deve essere un oggetto JSON.");
  }

  for (const key of requiredTop) {
    if (!(key in edition)) {
      throw new Error(`Manca la sezione obbligatoria: ${key}`);
    }
  }

  if (!edition.meta || !isValidDate(edition.meta.date)) {
    throw new Error("meta.date deve essere nel formato YYYY-MM-DD.");
  }

  if (!edition.meta.date_label || !edition.meta.updated_at) {
    throw new Error("meta.date_label e meta.updated_at sono obbligatori.");
  }

  if (!edition.market_regime.label || !edition.market_regime.summary) {
    throw new Error("Market Regime incompleto.");
  }

  const arrayKeys = [
    "market_tiles",
    "top_news",
    "catalysts",
    "indices",
    "intermarket",
    "earnings",
    "appointments",
    "key_movers",
  ];

  for (const key of arrayKeys) {
    if (!Array.isArray(edition[key])) {
      throw new Error(`${key} deve essere un array.`);
    }
  }


  const validSources = (sources) =>
    Array.isArray(sources) &&
    sources.length > 0 &&
    sources.every((source) =>
      source &&
      typeof source.name === "string" &&
      source.name.trim() &&
      typeof source.url === "string" &&
      source.url.trim()
    );

  const requireSources = (sources, label) => {
    if (!validSources(sources)) {
      throw new Error(`Manca una fonte specifica per: ${label}`);
    }
  };

  requireSources(edition.meta.sources, "data, orario e sessione");
  requireSources(edition.market_regime.sources, "Market Regime e breadth score");

  edition.market_tiles.forEach((item, index) =>
    requireSources(item.sources, `market_tiles[${index}]`)
  );

  edition.top_news.forEach((item, index) =>
    requireSources(item.sources, `top_news[${index}]`)
  );

  requireSources(
    edition.macro_rates.lead_sources || edition.macro_rates.sources,
    "valore principale Macro & Rates"
  );

  edition.macro_rates.metrics.forEach((item, index) =>
    requireSources(item.sources, `macro_rates.metrics[${index}]`)
  );

  edition.catalysts.forEach((item, index) =>
    requireSources(item.sources, `catalysts[${index}]`)
  );

  requireSources(edition.indices_summary.us_sources, "riepilogo indici USA");
  requireSources(edition.indices_summary.europe_sources, "riepilogo indici Europa");

  edition.indices.forEach((item, index) =>
    requireSources(item.sources, `indices[${index}]`)
  );

  edition.intermarket.forEach((item, index) =>
    requireSources(item.sources, `intermarket[${index}]`)
  );

  edition.earnings.forEach((item, index) =>
    requireSources(item.sources, `earnings[${index}]`)
  );

  requireSources(edition.appointments_sources, "calendario appuntamenti");

  edition.key_movers.forEach((item, index) =>
    requireSources(item.sources, `key_movers[${index}]`)
  );

  requireSources(edition.trading_focus.sources, "livelli operativi e Trading Focus");

  return edition;
}

async function saveEdition(env, edition) {
  if (!env.RASSEGNA_DATA) {
    throw new Error("Binding KV RASSEGNA_DATA non configurato.");
  }

  const validated = validateEdition(edition);
  const date = validated.meta.date;

  await env.RASSEGNA_DATA.put("latest", JSON.stringify(validated));
  await env.RASSEGNA_DATA.put(`edition:${date}`, JSON.stringify(validated));

  const current = (await env.RASSEGNA_DATA.get("archive", "json")) || [];
  const entry = {
    date,
    date_label: validated.meta.date_label,
    title: validated.market_regime.label,
    summary: validated.market_regime.summary,
    updated_at: validated.meta.updated_at,
  };

  const archive = [
    entry,
    ...current.filter((item) => item && item.date !== date),
  ]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 3650);

  await env.RASSEGNA_DATA.put("archive", JSON.stringify(archive));
  return { edition: validated, archive_entry: entry };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/latest") {
      if (env.RASSEGNA_DATA) {
        const data = await env.RASSEGNA_DATA.get("latest", "json");
        if (data) return jsonResponse(data);
      }
      return env.ASSETS.fetch(
        new Request(new URL("/data/latest.json", url), request),
      );
    }

    if (url.pathname === "/api/archive") {
      if (env.RASSEGNA_DATA) {
        const data = await env.RASSEGNA_DATA.get("archive", "json");
        if (data) return jsonResponse(data);
      }
      return env.ASSETS.fetch(
        new Request(new URL("/data/archive.json", url), request),
      );
    }

    if (url.pathname.startsWith("/api/edition/")) {
      const date = url.pathname.split("/").pop();
      if (!isValidDate(date)) {
        return jsonResponse({ error: "Data non valida." }, 400);
      }

      const data = env.RASSEGNA_DATA
        ? await env.RASSEGNA_DATA.get(`edition:${date}`, "json")
        : null;

      return data
        ? jsonResponse(data)
        : jsonResponse({ error: "Edizione non trovata." }, 404);
    }

    if (url.pathname === "/api/publish" && request.method === "POST") {
      if (
        !env.ADMIN_TOKEN ||
        request.headers.get("x-admin-token") !== env.ADMIN_TOKEN
      ) {
        return jsonResponse({ error: "Token non valido." }, 401);
      }

      try {
        const edition = await request.json();
        const saved = await saveEdition(env, edition);
        return jsonResponse({
          ok: true,
          date: saved.edition.meta.date,
          message: "Rassegna pubblicata e archiviata.",
        });
      } catch (error) {
        return jsonResponse(
          { error: error?.message || "Pubblicazione non riuscita." },
          400,
        );
      }
    }

    return env.ASSETS.fetch(request);
  },
};

// POST /api/vue {exposant} : une consultation de fiche dans l'application visiteur (anonyme)
import { compterVue } from "../lib/store.js";
import { json, corps } from "../lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { erreur: "POST attendu" });
  try {
    const b = await corps(req, 2000);
    const ex = String(b.exposant || "").replace(/[^a-z0-9-]/g, "").slice(0, 60);
    if (!ex) return json(res, 400, { erreur: "exposant manquant" });
    const jour = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Porto-Novo" }).format(new Date());
    await compterVue(jour, ex);
    json(res, 200, { ok: true });
  } catch (e) { json(res, 400, { erreur: e.message }); }
}

// POST /api/ping : battement de chaque tablette (état, batterie, compteurs du jour)
import { ecrireTablette } from "../lib/store.js";
import { json, corps } from "../lib/http.js";

const num = (v) => (Number.isFinite(Number(v)) ? Math.max(0, Math.round(Number(v))) : 0);

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { erreur: "POST attendu" });
  try {
    const b = await corps(req, 20_000);
    const touches = {};
    for (const [k, v] of Object.entries(b.touches || {}).slice(0, 200)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k) && v && typeof v === "object") {
        touches[k] = {};
        for (const [s, n] of Object.entries(v).slice(0, 20)) touches[k][String(s).slice(0, 60)] = num(n);
      }
    }
    await ecrireTablette(b.id, {
      espace: String(b.espace || "").slice(0, 60),
      nom: String(b.nom || "").slice(0, 60),
      ecran: String(b.ecran || "").slice(0, 20),
      solution: String(b.solution || "").slice(0, 60),
      batterie: b.batterie == null ? null : num(b.batterie),
      enCharge: !!b.enCharge,
      version: num(b.version),
      navigateur: String(b.navigateur || "").slice(0, 120),
      largeur: num(b.largeur),
      hauteur: num(b.hauteur),
      sessions: (() => { const s = {}; for (const [k, v] of Object.entries(b.sessions || {}).slice(0, 10)) if (/^\d{4}-\d{2}-\d{2}$/.test(k)) s[k] = num(v); return s; })(),
      touches
    });
    json(res, 200, { ok: true });
  } catch (e) {
    json(res, e.code === 413 ? 413 : 400, { erreur: e.message });
  }
}

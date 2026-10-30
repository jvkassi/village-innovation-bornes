// GET ?url= : le site répond-il ?
import { json, exigerAdmin } from "../../lib/http.js";

export default async function handler(req, res) {
  if (!exigerAdmin(req, res)) return;
  let u;
  try { u = new URL(String(req.query.url || "")); if (u.protocol !== "https:") throw 0; }
  catch { return json(res, 400, { erreur: "Adresse invalide : elle doit commencer par https://." }); }
  try {
    const ctrl = AbortSignal.timeout(8000);
    const r = await fetch(u, { redirect: "follow", signal: ctrl, headers: { "User-Agent": "Mozilla/5.0 VillageInnovationBorne/1.0" } });
    json(res, 200, { accessible: r.ok, statut: r.status, adresseFinale: r.url, raison: "" });
  } catch (e) {
    json(res, 200, { accessible: false, statut: 0, raison: "Site injoignable depuis nos serveurs (" + (e.name === "TimeoutError" ? "délai dépassé" : e.message) + "). Il peut être filtré hors du Bénin : testez-le sur place." });
  }
}

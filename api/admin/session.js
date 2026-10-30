// POST connexion · GET état · DELETE déconnexion
import { creerSession, fermerSession, estAdmin, motDePasseValide, json, corps } from "../../lib/http.js";

const essais = new Map();

export default async function handler(req, res) {
  if (req.method === "GET") return json(res, 200, { connecte: estAdmin(req) });
  if (req.method === "DELETE") { fermerSession(res); return json(res, 200, { ok: true }); }
  if (req.method !== "POST") return json(res, 405, { erreur: "Méthode non prise en charge" });
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0];
  const e = essais.get(ip) || { n: 0, t: Date.now() };
  if (Date.now() - e.t > 10 * 60_000) { e.n = 0; e.t = Date.now(); }
  if (e.n >= 8) return json(res, 429, { erreur: "Trop d'essais. Réessayez dans 10 minutes." });
  const { motDePasse } = await corps(req, 5000).catch(() => ({}));
  if (!motDePasseValide(motDePasse)) {
    e.n++; essais.set(ip, e);
    await new Promise((r) => setTimeout(r, 600));
    return json(res, 401, { erreur: "Mot de passe incorrect." });
  }
  essais.delete(ip);
  creerSession(res);
  json(res, 200, { ok: true });
}

// Espace exposant : connexion, fiche, proposition de modification, envoi d'images.
//   GET  ?a=session            état de la session
//   POST ?a=connexion          { email, motDePasse }
//   POST ?a=motdepasse         { actuel, nouveau }
//   DELETE ?a=session          déconnexion
//   GET  ?a=fiche              fiche publiée + dernière demande
//   PUT  ?a=fiche              soumettre une demande (validée ensuite par le MTDI)
//   POST ?a=image              image brute → URL publique
import { json, corps, creerSessionExposant, fermerSessionExposant, sessionExposant } from "../lib/http.js";
import { lireCompte, verifierMdp, changerMdp, marquerVu, soumettre, derniereDemande, extraire, emailNet } from "../lib/comptes.js";
import { configCourante, envoyerImage } from "../lib/store.js";
import { valider } from "../lib/valider.js";

export const config = { api: { bodyParser: false } };
const essais = new Map();

export default async function handler(req, res) {
  const a = new URL(req.url, "http://x").searchParams.get("a");
  try {
    if (a === "connexion" && req.method === "POST") {
      const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0];
      const e = essais.get(ip) || { n: 0, t: Date.now() };
      if (Date.now() - e.t > 10 * 60_000) { e.n = 0; e.t = Date.now(); }
      if (e.n >= 8) return json(res, 429, { erreur: "Trop d'essais. Réessayez dans 10 minutes." });
      const { email, motDePasse } = await corps(req, 5000);
      const c = await lireCompte(email);
      if (!c || !(await verifierMdp(motDePasse, c.empreinte))) {
        e.n++; essais.set(ip, e); await new Promise((r) => setTimeout(r, 600));
        return json(res, 401, { erreur: "E-mail ou mot de passe incorrect." });
      }
      essais.delete(ip);
      await marquerVu(c.email);
      creerSessionExposant(res, c.email, c.espace);
      return json(res, 200, { ok: true, provisoire: c.provisoire });
    }

    const s = sessionExposant(req);
    const compte = s && (await lireCompte(s.email));
    if (a === "session" && req.method === "GET") return json(res, 200, compte ? { connecte: true, email: compte.email, espace: compte.espace, provisoire: compte.provisoire } : { connecte: false });
    if (a === "session" && req.method === "DELETE") { fermerSessionExposant(res); return json(res, 200, { ok: true }); }
    if (!compte) return json(res, 401, { erreur: "Session expirée. Reconnectez-vous." });

    if (a === "motdepasse" && req.method === "POST") {
      const { actuel, nouveau } = await corps(req, 5000);
      if (!(await verifierMdp(actuel, compte.empreinte))) return json(res, 403, { erreur: "Le mot de passe actuel est incorrect." });
      if (typeof nouveau !== "string" || nouveau.length < 10) return json(res, 422, { erreur: "Choisissez au moins 10 caractères." });
      await changerMdp(compte.email, nouveau);
      return json(res, 200, { ok: true });
    }
    if (compte.provisoire) return json(res, 403, { erreur: "Choisissez d'abord votre mot de passe.", provisoire: true });

    if (a === "fiche" && req.method === "GET") {
      const cfg = await configCourante();
      const espace = (cfg.espaces || []).find((e) => e.id === compte.espace);
      if (!espace) return json(res, 404, { erreur: "Votre stand n'existe plus. Contactez l'équipe du Village." });
      return json(res, 200, { espace, demande: await derniereDemande(compte.espace), evenement: cfg.evenement });
    }
    if (a === "fiche" && req.method === "PUT") {
      const cfg = await configCourante();
      const i = (cfg.espaces || []).findIndex((e) => e.id === compte.espace);
      if (i < 0) return json(res, 404, { erreur: "Votre stand n'existe plus." });
      const prop = extraire(await corps(req, 200_000));
      const espaces = cfg.espaces.slice(); espaces[i] = { ...espaces[i], ...prop };
      const { config: net, erreurs } = valider({ ...cfg, espaces });
      if (erreurs.length) return json(res, 422, { erreur: "La demande contient des erreurs.", erreurs });
      const d = await soumettre(compte.espace, compte.email, extraire(net.espaces.find((e) => e.id === compte.espace)));
      return json(res, 200, d);
    }
    if (a === "image" && req.method === "POST") return json(res, 200, { url: await envoyerImage(req) });
    json(res, 404, { erreur: "Action inconnue" });
  } catch (e) {
    json(res, e.code && e.code < 600 ? e.code : 500, { erreur: e.message });
  }
}

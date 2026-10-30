// Accès des exposants et demandes de modification, côté MTDI.
//   GET                                   { comptes, demandes }
//   POST { action:"creer", email, espace } → { email, motDePasse } (affiché une seule fois)
//   POST { action:"reinitialiser", email } → { motDePasse }
//   POST { action:"accepter", id }         publie la demande sur les bornes
//   POST { action:"refuser", id, motif }
//   DELETE ?email=                          retire l'accès
import { json, corps, exigerAdmin } from "../../lib/http.js";
import { listerComptes, listerDemandes, creerCompte, lireCompte, supprimerCompte, lireDemande, traiterDemande, extraire, emailNet, emailOk } from "../../lib/comptes.js";
import { configCourante, publierConfig } from "../../lib/store.js";
import { valider } from "../../lib/valider.js";

export default async function handler(req, res) {
  if (!exigerAdmin(req, res)) return;
  try {
    if (req.method === "GET") return json(res, 200, { comptes: await listerComptes(), demandes: await listerDemandes() });
    if (req.method === "DELETE") {
      await supprimerCompte(new URL(req.url, "http://x").searchParams.get("email"));
      return json(res, 200, { ok: true });
    }
    if (req.method !== "POST") return json(res, 405, { erreur: "Méthode non prise en charge" });
    const b = await corps(req, 20_000);

    if (b.action === "creer") {
      const email = emailNet(b.email);
      if (!emailOk(email)) return json(res, 422, { erreur: "Adresse e-mail invalide." });
      const cfg = await configCourante();
      if (!(cfg.espaces || []).some((e) => e.id === b.espace)) return json(res, 422, { erreur: "Publiez d'abord ce stand, puis créez son accès." });
      const ex = await lireCompte(email);
      if (ex && ex.espace !== b.espace) return json(res, 409, { erreur: "Cette adresse a déjà accès à un autre stand." });
      return json(res, 200, { email, motDePasse: await creerCompte(email, b.espace) });
    }
    if (b.action === "reinitialiser") {
      const c = await lireCompte(b.email);
      if (!c) return json(res, 404, { erreur: "Compte introuvable." });
      return json(res, 200, { email: c.email, motDePasse: await creerCompte(c.email, c.espace) });
    }
    if (b.action === "accepter" || b.action === "refuser") {
      const d = await lireDemande(b.id);
      if (!d || d.statut !== "en_attente") return json(res, 409, { erreur: "Cette demande a déjà été traitée." });
      if (b.action === "refuser") { await traiterDemande(d.id, "refusee", String(b.motif || "").slice(0, 300) || null); return json(res, 200, { ok: true }); }
      const cfg = await configCourante();
      const i = (cfg.espaces || []).findIndex((e) => e.id === d.espace);
      if (i < 0) return json(res, 404, { erreur: "Le stand de cette demande n'existe plus." });
      const espaces = cfg.espaces.slice(); espaces[i] = { ...espaces[i], ...extraire(d.doc) };
      const { config: net, erreurs } = valider({ ...cfg, espaces });
      if (erreurs.length) return json(res, 422, { erreur: "La demande contient des erreurs.", erreurs });
      const doc = await publierConfig(net, `admin (demande de ${d.email})`);
      await traiterDemande(d.id, "acceptee");
      return json(res, 200, doc);
    }
    json(res, 400, { erreur: "Action inconnue" });
  } catch (e) {
    json(res, 500, { erreur: e.message });
  }
}

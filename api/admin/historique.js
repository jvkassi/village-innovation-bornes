// GET liste des versions publiées · POST {version} restaure une version
import { historique, lireVersion, publierConfig } from "../../lib/store.js";
import { valider } from "../../lib/valider.js";
import { json, corps, exigerAdmin } from "../../lib/http.js";

export default async function handler(req, res) {
  if (!exigerAdmin(req, res)) return;
  if (req.method === "GET") return json(res, 200, await historique());
  if (req.method === "POST") {
    const { version } = await corps(req, 2000);
    const ancien = await lireVersion(version);
    if (!ancien) return json(res, 404, { erreur: "Version introuvable." });
    const { config } = valider(ancien);
    return json(res, 200, await publierConfig(config, "restauration"));
  }
  json(res, 405, { erreur: "Méthode non prise en charge" });
}

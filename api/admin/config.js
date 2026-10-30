// GET brouillon courant (inclut espaces masqués) · PUT publier
import { lireConfig, publierConfig } from "../../lib/store.js";
import { valider } from "../../lib/valider.js";
import { json, corps, exigerAdmin } from "../../lib/http.js";
import fs from "node:fs/promises";
import path from "node:path";

export default async function handler(req, res) {
  if (!exigerAdmin(req, res)) return;
  if (req.method === "GET") {
    let c = await lireConfig();
    if (!c) c = { ...JSON.parse(await fs.readFile(path.join(process.cwd(), "public/config/espaces.json"), "utf8")), version: 0 };
    return json(res, 200, c);
  }
  if (req.method === "PUT") {
    try {
      const { config, erreurs } = valider(await corps(req, 500_000));
      if (erreurs.length) return json(res, 422, { erreur: "La publication contient des erreurs.", erreurs });
      const doc = await publierConfig(config, "admin");
      return json(res, 200, doc);
    } catch (e) {
      return json(res, 500, { erreur: "Publication impossible : " + e.message });
    }
  }
  json(res, 405, { erreur: "Méthode non prise en charge" });
}

// GET état de toutes les tablettes · DELETE ?id= retire une tablette de la liste
import { lireTablettes, oublierTablette, lireVues } from "../../lib/store.js";
import { json, exigerAdmin } from "../../lib/http.js";

export default async function handler(req, res) {
  if (!exigerAdmin(req, res)) return;
  if (req.method === "DELETE") {
    await oublierTablette(String(req.query.id || "").replace(/[^a-zA-Z0-9_-]/g, ""));
    return json(res, 200, { ok: true });
  }
  const [tablettes, vues] = await Promise.all([lireTablettes(), lireVues()]);
  json(res, 200, { maintenant: new Date().toISOString(), tablettes, vues });
}

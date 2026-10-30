// POST image brute (Content-Type image/*) → URL publique
import { envoyerFichier } from "../../lib/store.js";
import { json, exigerAdmin } from "../../lib/http.js";

export const config = { api: { bodyParser: false } };
const TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg" };

export default async function handler(req, res) {
  if (!exigerAdmin(req, res)) return;
  if (req.method !== "POST") return json(res, 405, { erreur: "POST attendu" });
  const type = String(req.headers["content-type"] || "").split(";")[0];
  if (!TYPES[type]) return json(res, 415, { erreur: "Format accepté : PNG, JPG, WebP ou SVG." });
  const morceaux = []; let n = 0;
  for await (const m of req) { n += m.length; if (n > 2_000_000) return json(res, 413, { erreur: "Image trop lourde (2 Mo maximum)." }); morceaux.push(m); }
  const b = await envoyerFichier(`logo.${TYPES[type]}`, Buffer.concat(morceaux), type);
  json(res, 200, { url: b.url });
}

// GET /api/config : contenu publié, lu par les bornes (repli sur le fichier statique)
import { lireConfig } from "../lib/store.js";
import { json } from "../lib/http.js";
import fs from "node:fs/promises";
import path from "node:path";

export default async function handler(req, res) {
  let config = await lireConfig();
  if (!config) {
    const brut = await fs.readFile(path.join(process.cwd(), "public/config/espaces.json"), "utf8");
    config = { ...JSON.parse(brut), version: 0 };
  }
  config.espaces = (config.espaces || []).filter((e) => e.actif !== false);
  res.setHeader("Cache-Control", "no-store");
  json(res, 200, config);
}

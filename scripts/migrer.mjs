// Crée le schéma et reprend la dernière publication stockée dans Blob (une seule fois).
import { neon } from "@neondatabase/serverless";
import { head } from "@vercel/blob";
import fs from "node:fs";

const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);
for (const q of fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8").split(";").map((s) => s.trim()).filter(Boolean)) await sql(q);
console.log("schéma ok");

const [{ n }] = await sql`select count(*)::int as n from publications`;
if (n === 0) {
  let doc = null;
  try { const h = await head("config/actuelle.json"); doc = await (await fetch(`${h.url}?v=${Date.now()}`)).json(); } catch {}
  if (!doc) { doc = JSON.parse(fs.readFileSync(new URL("../public/config/espaces.json", import.meta.url), "utf8")); delete doc._lisezmoi; doc.version = Date.now(); }
  await sql`insert into publications (version, doc, auteur) values (${doc.version}, ${JSON.stringify(doc)}::jsonb, 'reprise')`;
  console.log("publication reprise :", doc.version, doc.espaces.length, "stands");
} else console.log(n, "publication(s) déjà présentes");

// Données : Neon (Postgres) pour les contenus, l'historique et la télémétrie ; Vercel Blob pour les logos.
import { put } from "@vercel/blob";
import crypto from "node:crypto";
import { sql } from "./db.js";

/* ---------- Contenus publiés ---------- */
export async function lireConfig() {
  const r = await sql`select doc from publications order by version desc limit 1`;
  return r[0]?.doc || null;
}

export async function publierConfig(config, auteur) {
  const version = Date.now();
  const doc = { ...config, version, publieLe: new Date(version).toISOString(), publiePar: auteur || "admin" };
  await sql`insert into publications (version, doc, auteur) values (${version}, ${JSON.stringify(doc)}::jsonb, ${doc.publiePar})`;
  return doc;
}

export async function historique() {
  const r = await sql`select version, auteur, pg_column_size(doc) as taille from publications order by version desc limit 30`;
  return r.map((x) => ({ version: Number(x.version), auteur: x.auteur, taille: x.taille }));
}

export async function lireVersion(version) {
  const r = await sql`select doc from publications where version = ${Number(version)}`;
  return r[0]?.doc || null;
}

/* ---------- Tablettes : un battement par minute et par tablette ---------- */
export async function ecrireTablette(id, data) {
  const sid = String(id).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
  if (!sid) throw new Error("id invalide");
  await sql`insert into tablettes (id, espace, data, vu_le) values (${sid}, ${data.espace || ""}, ${JSON.stringify(data)}::jsonb, now())
            on conflict (id) do update set espace = excluded.espace, data = excluded.data, vu_le = now()`;
}

export async function lireTablettes() {
  const r = await sql`select id, data, vu_le from tablettes order by espace, id`;
  return r.map((x) => ({ ...x.data, id: x.id, vuLe: new Date(x.vu_le).toISOString() }));
}

export async function oublierTablette(id) {
  await sql`delete from tablettes where id = ${String(id)}`;
}

/* ---------- Application visiteur : consultations des fiches, par jour ---------- */
export async function compterVue(jour, exposant) {
  await sql`insert into vues (jour, exposant, n) values (${jour}, ${exposant}, 1)
            on conflict (jour, exposant) do update set n = vues.n + 1`;
}

export async function lireVues() {
  const r = await sql`select to_char(jour, 'YYYY-MM-DD') as jour, exposant, n from vues order by jour`;
  return r.map((x) => ({ jour: x.jour, exposant: x.exposant, n: Number(x.n) }));
}

/* ---------- Logos : Vercel Blob ---------- */
export async function envoyerFichier(nom, buffer, type) {
  const ext = (nom.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const cle = crypto.randomBytes(6).toString("hex");
  return put(`logos/${cle}.${ext}`, buffer, { access: "public", contentType: type, addRandomSuffix: false });
}

// Dernière publication, ou contenu d'exemple si rien n'a encore été publié
export async function configCourante() {
  const c = await lireConfig();
  if (c) return c;
  const fs = await import("node:fs/promises"), path = await import("node:path");
  return { ...JSON.parse(await fs.readFile(path.join(process.cwd(), "public/config/espaces.json"), "utf8")), version: 0 };
}

export async function envoyerImage(req, max = 2_000_000) {
  const TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg" };
  const type = String(req.headers["content-type"] || "").split(";")[0];
  if (!TYPES[type]) throw Object.assign(new Error("Format accepté : PNG, JPG, WebP ou SVG."), { code: 415 });
  const morceaux = []; let n = 0;
  for await (const m of req) { n += m.length; if (n > max) throw Object.assign(new Error("Image trop lourde (2 Mo maximum)."), { code: 413 }); morceaux.push(m); }
  return (await envoyerFichier(`image.${TYPES[type]}`, Buffer.concat(morceaux), type)).url;
}

// Comptes des exposants et demandes de modification (validées par le MTDI).
import crypto from "node:crypto";
import { sql } from "./db.js";

const scrypt = (mdp, sel) => new Promise((ok, ko) => crypto.scrypt(mdp, sel, 32, (e, k) => (e ? ko(e) : ok(k))));
export async function empreinte(mdp) {
  const sel = crypto.randomBytes(16);
  return `scrypt$${sel.toString("base64url")}$${(await scrypt(mdp, sel)).toString("base64url")}`;
}
export async function verifierMdp(mdp, emp) {
  const [, sel, h] = String(emp || "").split("$");
  if (!sel || !h || typeof mdp !== "string") return false;
  const k = await scrypt(mdp, Buffer.from(sel, "base64url"));
  const a = Buffer.from(h, "base64url");
  return a.length === k.length && crypto.timingSafeEqual(a, k);
}
// Mot de passe provisoire lisible : 3 groupes de 4, sans caractères ambigus
export function mdpProvisoire() {
  const A = "abcdefghjkmnpqrstuvwxyz23456789";
  const b = crypto.randomBytes(12);
  return [0, 4, 8].map((i) => [...b.subarray(i, i + 4)].map((x) => A[x % A.length]).join("")).join("-");
}
export const emailNet = (e) => String(e || "").trim().toLowerCase().slice(0, 120);
export const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export async function lireCompte(email) {
  const r = await sql`select email, espace, empreinte, provisoire, cree_le, vu_le from comptes where email = ${emailNet(email)}`;
  return r[0] || null;
}
export async function listerComptes() {
  const r = await sql`select email, espace, provisoire, cree_le, vu_le from comptes order by espace, email`;
  return r.map((c) => ({ email: c.email, espace: c.espace, provisoire: c.provisoire, creeLe: c.cree_le, vuLe: c.vu_le }));
}
export async function creerCompte(email, espace) {
  const mdp = mdpProvisoire();
  await sql`insert into comptes (email, espace, empreinte, provisoire) values (${emailNet(email)}, ${espace}, ${await empreinte(mdp)}, true)
            on conflict (email) do update set espace = excluded.espace, empreinte = excluded.empreinte, provisoire = true`;
  return mdp;
}
export async function changerMdp(email, mdp) {
  await sql`update comptes set empreinte = ${await empreinte(mdp)}, provisoire = false where email = ${emailNet(email)}`;
}
export async function marquerVu(email) { await sql`update comptes set vu_le = now() where email = ${emailNet(email)}`; }
export async function supprimerCompte(email) { await sql`delete from comptes where email = ${emailNet(email)}`; }

/* ---------- Demandes ---------- */
const versDemande = (d) => ({ id: Number(d.id), espace: d.espace, email: d.email, doc: d.doc, statut: d.statut, soumisLe: d.soumis_le, traiteLe: d.traite_le, motif: d.motif });
export async function soumettre(espace, email, doc) {
  // Une seule demande en attente par espace : la nouvelle remplace la précédente
  const r = await sql`update demandes set doc = ${JSON.stringify(doc)}::jsonb, email = ${email}, soumis_le = now() where espace = ${espace} and statut = 'en_attente' returning *`;
  if (r[0]) return versDemande(r[0]);
  const n = await sql`insert into demandes (espace, email, doc) values (${espace}, ${email}, ${JSON.stringify(doc)}::jsonb) returning *`;
  return versDemande(n[0]);
}
export async function derniereDemande(espace) {
  const r = await sql`select * from demandes where espace = ${espace} order by soumis_le desc limit 1`;
  return r[0] ? versDemande(r[0]) : null;
}
export async function listerDemandes() {
  const r = await sql`(select * from demandes where statut = 'en_attente' order by soumis_le)
                      union all (select * from demandes where statut <> 'en_attente' order by traite_le desc limit 15)`;
  return r.map(versDemande);
}
export async function lireDemande(id) {
  const r = await sql`select * from demandes where id = ${Number(id)}`;
  return r[0] ? versDemande(r[0]) : null;
}
export async function traiterDemande(id, statut, motif = null) {
  await sql`update demandes set statut = ${statut}, motif = ${motif}, traite_le = now() where id = ${Number(id)}`;
}

// Champs qu'un exposant peut proposer ; le reste (numéro, thématique, plateforme, visibilité) reste au MTDI
export const CHAMPS_EXPOSANT = ["nomComplet", "accroche", "presentation", "activites", "reperes", "site", "email", "telephone", "logo", "image", "solutions"];
export function extraire(src) {
  const o = {};
  for (const k of CHAMPS_EXPOSANT) if (src && k in src) o[k] = src[k];
  return o;
}

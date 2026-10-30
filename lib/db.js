// Connexion Neon (Postgres serverless, HTTP) : une requête = un aller-retour, adapté aux fonctions Vercel.
import { neon } from "@neondatabase/serverless";

let client;
export function sql(strings, ...values) {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL manquant");
    client = neon(url);
  }
  return client(strings, ...values);
}

import crypto from "node:crypto";

const COOKIE = "village_admin";
const DUREE = 60 * 60 * 24 * 7; // 7 jours

const secret = () => process.env.SESSION_SECRET || "dev-secret";
const signer = (v) => crypto.createHmac("sha256", secret()).update(v).digest("base64url");

export function creerSession(res) {
  const exp = Math.floor(Date.now() / 1000) + DUREE;
  const v = `admin.${exp}`;
  res.setHeader("Set-Cookie", `${COOKIE}=${v}.${signer(v)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DUREE}`);
}

export function fermerSession(res) {
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}

export function estAdmin(req) {
  const c = (req.headers.cookie || "").split(/;\s*/).find((x) => x.startsWith(COOKIE + "="));
  if (!c) return false;
  const [role, exp, sig] = c.slice(COOKIE.length + 1).split(".");
  if (!role || !exp || !sig) return false;
  const attendu = signer(`${role}.${exp}`);
  if (sig.length !== attendu.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(attendu))) return false;
  return Number(exp) > Date.now() / 1000;
}

export function motDePasseValide(mdp) {
  const attendu = process.env.ADMIN_PASSWORD || "";
  if (!attendu || typeof mdp !== "string") return false;
  const a = crypto.createHash("sha256").update(mdp).digest();
  const b = crypto.createHash("sha256").update(attendu).digest();
  return crypto.timingSafeEqual(a, b);
}

export function json(res, code, data) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

export async function corps(req, max = 1_000_000) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  const morceaux = [];
  let n = 0;
  for await (const m of req) {
    n += m.length;
    if (n > max) throw Object.assign(new Error("Requête trop volumineuse"), { code: 413 });
    morceaux.push(m);
  }
  const brut = Buffer.concat(morceaux).toString("utf8");
  return brut ? JSON.parse(brut) : {};
}

export function exigerAdmin(req, res) {
  if (estAdmin(req)) return true;
  json(res, 401, { erreur: "Session expirée. Reconnectez-vous." });
  return false;
}

/* ---------- Session exposant ---------- */
const COOKIE_EX = "village_exposant";
export function creerSessionExposant(res, email, espace) {
  const exp = Math.floor(Date.now() / 1000) + DUREE;
  const v = Buffer.from(JSON.stringify({ e: email, s: espace, x: exp })).toString("base64url");
  res.setHeader("Set-Cookie", `${COOKIE_EX}=${v}.${signer("ex." + v)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DUREE}`);
}
export function fermerSessionExposant(res) {
  res.setHeader("Set-Cookie", `${COOKIE_EX}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}
export function sessionExposant(req) {
  const c = (req.headers.cookie || "").split(/;\s*/).find((x) => x.startsWith(COOKIE_EX + "="));
  if (!c) return null;
  const [v, sig] = c.slice(COOKIE_EX.length + 1).split(".");
  if (!v || !sig) return null;
  const attendu = signer("ex." + v);
  if (sig.length !== attendu.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(attendu))) return null;
  try { const d = JSON.parse(Buffer.from(v, "base64url").toString()); return d.x > Date.now() / 1000 ? { email: d.e, espace: d.s } : null; } catch { return null; }
}

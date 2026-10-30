// Nettoie et contrôle une configuration avant publication.
const txt = (v, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const slug = (v) => txt(v, 60).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const ICONES = ["plan", "building", "receipt", "doc", "passport", "id", "pulse", "globe", "leaf", "wallet", "sun", "route", "phone", "school", "chip", "chat"];

function urlOk(u) {
  try {
    const x = new URL(u, "https://exemple.bj");
    return x.protocol === "https:" || (u.startsWith("/") && !u.startsWith("//"));
  } catch {
    return false;
  }
}
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export function valider(entree) {
  const erreurs = [];
  const e = entree?.evenement || {};
  const m = entree?.minuteries || {};
  const config = {
    evenement: {
      nom: txt(e.nom, 80) || "Le Village de l'Innovation",
      accroche: txt(e.accroche, 140),
      edition: txt(e.edition, 100),
      dates: txt(e.dates, 60),
      horaires: txt(e.horaires, 40),
      lieu: txt(e.lieu, 100)
    },
    minuteries: {
      retourAccueilSecondes: Math.min(600, Math.max(20, Number(m.retourAccueilSecondes) || 60)),
      veilleSecondes: Math.min(600, Math.max(15, Number(m.veilleSecondes) || 45))
    },
    programme: [],
    espaces: []
  };

  (Array.isArray(entree?.programme) ? entree.programme : []).slice(0, 200).forEach((p, i) => {
    const s = {
      jour: /^\d{4}-\d{2}-\d{2}$/.test(p.jour) ? p.jour : "",
      heure: /^\d{1,2}:\d{2}$/.test(String(p.heure || "").trim()) ? String(p.heure).trim().padStart(5, "0") : "",
      titre: txt(p.titre, 120),
      lieu: txt(p.lieu, 80)
    };
    if (!s.titre && !s.heure) return; // ligne vide ignorée
    if (!s.jour || !s.heure || !s.titre) erreurs.push(`Programme, ligne ${i + 1} : jour, heure (HH:MM) et titre sont obligatoires.`);
    config.programme.push(s);
  });
  config.programme.sort((a, b) => (a.jour + a.heure).localeCompare(b.jour + b.heure));

  const vus = new Set();
  const numeros = new Map();
  (Array.isArray(entree?.espaces) ? entree.espaces : []).slice(0, 40).forEach((es, i) => {
    let id = slug(es.id) || slug(es.nom) || `stand-${i + 1}`;
    while (vus.has(id)) id += "-2";
    vus.add(id);
    const type = es.type === "accueil" ? "accueil" : "exposant";
    const nom = txt(es.nom, 60);
    const ref = nom || `Stand n°${i + 1}`;
    if (!nom) erreurs.push(`Stand n°${i + 1} : le nom est obligatoire.`);
    const numero = txt(String(es.numero ?? ""), 8);
    if (numero && es.actif !== false) {
      if (numeros.has(numero)) erreurs.push(`${ref} : le numéro de stand ${numero} est déjà pris par ${numeros.get(numero)}.`);
      numeros.set(numero, ref);
    }
    const site = txt(es.site, 300);
    if (site && !urlOk(site)) erreurs.push(`${ref} : le site web doit commencer par https://.`);
    const email = txt(es.email, 120);
    if (email && !emailOk(email)) erreurs.push(`${ref} : l'adresse e-mail n'est pas valide.`);

    const sols = (Array.isArray(es.solutions) ? es.solutions : []).slice(0, 4).map((s, j) => {
      const r = `${ref}, solution ${j + 1}`;
      const t = s.type === "app" ? "app" : "web";
      const sol = { id: slug(s.id) || `${id}-${j + 1}`, nom: txt(s.nom, 60), description: txt(s.description, 160), type: t,
        icone: ICONES.includes(s.icone) ? s.icone : "globe", logo: txt(s.logo, 400) };
      if (!sol.nom) erreurs.push(`${r} : le nom est obligatoire.`);
      if (sol.logo && !urlOk(sol.logo)) sol.logo = "";
      if (t === "web") {
        sol.url = txt(s.url, 500);
        if (!sol.url || !urlOk(sol.url)) erreurs.push(`${r} : l'adresse doit commencer par https://.`);
        try { sol.domaine = new URL(sol.url, "https://village.bj").hostname.replace(/^www\./, ""); } catch { sol.domaine = ""; }
      } else {
        sol.android = txt(s.android, 120);
        sol.ios = txt(s.ios, 200);
        sol.url = txt(s.url, 500);
        if (!sol.android && !sol.ios) erreurs.push(`${r} : indiquez le paquet Android ou le lien iOS de l'application.`);
      }
      return sol;
    });

    config.espaces.push({
      id, type, numero, nom,
      thematique: txt(es.thematique, 40),
      accroche: txt(es.accroche, 90),
      presentation: txt(es.presentation, 600),
      site: site && urlOk(site) ? site : "",
      email: email && emailOk(email) ? email : "",
      telephone: txt(es.telephone, 30),
      logo: urlOk(txt(es.logo, 400)) ? txt(es.logo, 400) : "",
      consigne: txt(es.consigne, 100),
      actif: es.actif !== false,
      solutions: sols
    });
  });

  return { config, erreurs };
}

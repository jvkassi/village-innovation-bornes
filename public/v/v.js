/* Application visiteur — Le Village de l'Innovation (sans téléchargement) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const TZ = "Africa/Porto-Novo";
  const jour = () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
  const heure = () => new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ }).format(new Date());
  const fmtJour = (d, o) => new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", ...o }).format(new Date(d + "T12:00:00Z"));
  const I = {
    fleche: '<svg viewBox="0 0 24 24"><path d="M4.5 12h15M13.5 6l6 6-6 6"/></svg>',
    retour: '<svg viewBox="0 0 24 24"><path d="M19.5 12h-15M10.5 6l-6 6 6 6"/></svg>',
    etoile: '<svg viewBox="0 0 24 24"><path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/></svg>',
    loupe: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>',
    plan: '<svg viewBox="0 0 24 24"><path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z"/><path d="M9 4v13.5M15 6.5V20"/></svg>',
    web: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.2-3.5-8.5s1.1-6.1 3.5-8.5"/></svg>',
    mail: '<svg viewBox="0 0 24 24"><rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/></svg>',
    tel: '<svg viewBox="0 0 24 24"><path d="M5 4h4l1.5 4.5-2.5 1.5a11 11 0 0 0 6 6l1.5-2.5L20 15v4a1.5 1.5 0 0 1-1.5 1.5A16 16 0 0 1 3.5 5.5 1.5 1.5 0 0 1 5 4"/></svg>',
    partage: '<svg viewBox="0 0 24 24"><path d="M12 15V3.5M7.5 8 12 3.5 16.5 8"/><path d="M5 12.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-6.5"/></svg>'
  };

  let cfg = null;
  let filtre = "", recherche = "", jourChoisi = null;

  /* ---------- Favoris ---------- */
  const CLE = "village.favoris";
  const favs = new Set((() => { try { return JSON.parse(localStorage.getItem(CLE)) || []; } catch { return []; } })());
  const basculer = (id) => { favs.has(id) ? favs.delete(id) : favs.add(id); try { localStorage.setItem(CLE, JSON.stringify([...favs])); } catch {} };

  /* ---------- Données ---------- */
  async function charger() {
    try {
      const r = await fetch("/api/config", { cache: "no-store" });
      if (!r.ok) throw 0;
      const c = await r.json();
      try { localStorage.setItem("village.v.config", JSON.stringify(c)); } catch {}
      return c;
    } catch {
      try { const c = JSON.parse(localStorage.getItem("village.v.config")); if (c) return c; } catch {}
      return (await fetch("/config/espaces.json")).json();
    }
  }
  const exposants = () => (cfg.espaces || []).filter((e) => e.type !== "accueil" && e.actif !== false)
    .sort((a, b) => (parseInt(a.numero, 10) || 999) - (parseInt(b.numero, 10) || 999));
  const accueil = () => (cfg.espaces || []).find((e) => e.type === "accueil" && e.actif !== false);
  const trouver = (id) => exposants().find((e) => e.id === id);

  /* ---------- Routeur ---------- */
  const routes = { "": accueilVue, exposant: ficheVue, programme: programmeVue, plan: planVue, favoris: favorisVue };
  function router() {
    const [, nom = "", arg = ""] = (location.hash.replace(/^#/, "") || "/").split("/");
    const [vue, query] = nom.split("?");
    const f = routes[vue] || accueilVue;
    const params = new URLSearchParams(query || (arg.includes("?") ? arg.split("?")[1] : ""));
    $("#vue").innerHTML = `<div class="entree">${f(decodeURIComponent(arg.split("?")[0]), params)}</div>`;
    const onglet = vue === "exposant" ? "exposants" : vue || "exposants";
    document.querySelectorAll(".onglets a").forEach((a) => { if (a.dataset.route === onglet) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    window.scrollTo(0, 0);
    $("#vue").focus({ preventScroll: true });
    const titre = vue === "exposant" && trouver(arg) ? trouver(arg).nom : { programme: "Programme", plan: "Plan", favoris: "Mes stands" }[vue];
    document.title = (titre ? titre + " · " : "") + (cfg.evenement?.nom || "Le Village de l'Innovation");
  }

  /* ---------- Vues ---------- */
  function prochaineSession() {
    const p = cfg.programme || [];
    const j = jour(), h = heure();
    const futur = p.filter((x) => x.jour > j || (x.jour === j && x.heure >= h)).sort((a, b) => (a.jour + a.heure).localeCompare(b.jour + b.heure));
    return futur[0];
  }

  function ligneExposant(e) {
    return `<li><a class="ex" href="#/exposant/${encodeURIComponent(e.id)}">
      <span class="n">${e.logo ? `<img src="${esc(e.logo)}" alt="">` : esc(e.numero || "·")}</span>
      <span><b>${esc(e.nom)}</b>${e.accroche ? `<small>${esc(e.accroche)}</small>` : ""}<span class="theme">${e.numero ? "Stand " + esc(e.numero) : ""}${e.numero && e.thematique ? " · " : ""}${esc(e.thematique || "")}</span></span>
      <button class="etoile" data-fav="${esc(e.id)}" aria-pressed="${favs.has(e.id)}" aria-label="Ajouter ${esc(e.nom)} à mes stands">${I.etoile}</button>
    </a></li>`;
  }

  function accueilVue() {
    const ev = cfg.evenement || {};
    const ac = accueil();
    const s = prochaineSession();
    const ex = exposants();
    const themes = [...new Set(ex.map((e) => e.thematique).filter(Boolean))];
    return `
      <section class="hero">
        <div class="ed">${esc(ev.edition || "")}</div>
        <h1>${esc(ev.nom || "Le Village de l'Innovation")}</h1>
        <p>${esc(ac?.presentation || ev.accroche || "")}<br>${esc([ev.dates, ev.horaires].filter(Boolean).join(", "))} · ${esc(ev.lieu || "")}</p>
      </section>
      ${s ? `<a class="maintenant" href="#/programme?j=${s.jour}"><time>${esc(s.heure)}</time><span><span class="lbl">${s.jour === jour() ? "Prochainement" : "Au programme " + fmtJour(s.jour, { weekday: "long", day: "numeric", month: "long" })}</span><b>${esc(s.titre)}</b>${s.lieu ? `<small>${esc(s.lieu)}</small>` : ""}</span></a>` : ""}
      <div class="recherche">${I.loupe}<input type="search" id="q" placeholder="Rechercher un exposant ou un service" value="${esc(recherche)}" autocomplete="off" enterkeyhint="search" aria-label="Rechercher"></div>
      ${themes.length > 1 ? `<div class="puces" role="group" aria-label="Thématiques">${[["", "Tous"], ...themes.map((t) => [t, t])].map(([v, l]) => `<button data-theme="${esc(v)}" aria-pressed="${v === filtre}">${esc(l)}</button>`).join("")}</div>` : ""}
      <h2 class="section" id="compte"></h2>
      <ol class="liste" id="liste"></ol>
      <p class="pied">Contenus fournis par les exposants et l'organisation, susceptibles d'évoluer pendant l'événement.</p>`;
  }
  function filtrerListe() {
    const l = $("#liste"); if (!l) return;
    const t = recherche.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const res = exposants().filter((e) => (!filtre || e.thematique === filtre) &&
      (!t || [e.nom, e.accroche, e.presentation, e.thematique, ...(e.solutions || []).map((s) => s.nom + " " + s.description)].some((x) => norm(x).includes(t))));
    $("#compte").textContent = res.length ? `${res.length} exposant${res.length > 1 ? "s" : ""}` : "";
    l.innerHTML = res.length ? res.map(ligneExposant).join("") : `<li class="vide">Aucun exposant ne correspond à « ${esc(recherche)} ».</li>`;
  }

  function compterVue(id) {
    // Une consultation par exposant et par visiteur dans la journée
    const cle = "village.vu." + id + "." + jour();
    try { if (localStorage.getItem(cle)) return; localStorage.setItem(cle, "1"); } catch {}
    try { navigator.sendBeacon("/api/vue", new Blob([JSON.stringify({ exposant: id })], { type: "application/json" })); } catch {}
  }
  function ficheVue(id) {
    const e = trouver(id);
    if (e) compterVue(e.id);
    if (!e) return `<a class="retour" href="#/">${I.retour}Exposants</a><p class="vide">Cet exposant n'est plus présenté. Retrouvez tous les stands dans la liste.</p>`;
    let site = ""; try { site = e.site ? new URL(e.site).hostname.replace(/^www\./, "") : ""; } catch {}
    const sols = (e.solutions || []).filter((s) => s.url);
    return `<article class="fiche">
      <a class="retour" href="#/">${I.retour}Exposants</a>
      <div class="fiche-tete">${e.numero ? `<span class="stand">Stand ${esc(e.numero)}</span>` : ""}<span class="theme">${esc(e.thematique || "")}</span></div>
      ${e.logo ? `<div class="fiche-logo"><img src="${esc(e.logo)}" alt="Logo ${esc(e.nom)}"></div>` : ""}
      <h1>${esc(e.nom)}</h1>
      ${e.accroche ? `<p class="accroche">${esc(e.accroche)}</p>` : ""}
      ${e.presentation ? `<p class="pres">${esc(e.presentation)}</p>` : ""}
      <div class="actions">
        <button class="btn ${favs.has(e.id) ? "" : "plein"}" data-fav="${esc(e.id)}" aria-pressed="${favs.has(e.id)}">${I.etoile}${favs.has(e.id) ? "Dans mes stands" : "Garder ce stand"}</button>
        <a class="btn" href="#/plan?s=${encodeURIComponent(e.id)}">${I.plan}Voir sur le plan</a>
        ${navigator.share ? `<button class="btn large" data-partager="${esc(e.id)}">${I.partage}Partager</button>` : ""}
      </div>
      ${sols.length ? `<h2 class="section">À découvrir</h2><ul class="contacts" style="border:0">${sols.map((s) => `<li><a class="sol" href="${esc(s.url.startsWith("/") ? s.url : s.url)}" target="_blank" rel="noopener"><span><b>${esc(s.nom)}</b>${s.description ? `<small>${esc(s.description)}</small>` : ""}</span><span class="go">${I.fleche}</span></a></li>`).join("")}</ul>` : ""}
      ${site || e.email || e.telephone ? `<h2 class="section">Contacter</h2><div class="contacts">
        ${site ? `<a href="${esc(e.site)}" target="_blank" rel="noopener">${I.web}${esc(site)}</a>` : ""}
        ${e.email ? `<a href="mailto:${esc(e.email)}">${I.mail}${esc(e.email)}</a>` : ""}
        ${e.telephone ? `<a href="tel:${esc(e.telephone.replace(/[^\d+]/g, ""))}">${I.tel}${esc(e.telephone)}</a>` : ""}
      </div>` : ""}
    </article>`;
  }

  function programmeVue(_, params) {
    const p = cfg.programme || [];
    const jours = [...new Set(p.map((x) => x.jour))].sort();
    if (!jours.length) return `<h1 class="titre-page">Programme</h1><p class="vide">Le programme sera publié prochainement.</p>`;
    const j = jour(), h = heure();
    jourChoisi = params.get("j") && jours.includes(params.get("j")) ? params.get("j") : jourChoisi && jours.includes(jourChoisi) ? jourChoisi : jours.includes(j) ? j : jours[0];
    const sess = p.filter((x) => x.jour === jourChoisi);
    // Session en cours = la dernière commencée aujourd'hui ; celles d'avant sont passées
    const enCours = jourChoisi === j ? sess.map((x) => x.heure <= h).lastIndexOf(true) : -1;
    const etat = (i) => jourChoisi < j || (jourChoisi === j && i < enCours) ? "passee" : i === enCours ? "encours" : "";
    return `<h1 class="titre-page">Programme</h1>
      <p class="sous">${esc([cfg.evenement?.horaires, cfg.evenement?.lieu].filter(Boolean).join(" · "))}</p>
      <div class="jours" role="tablist">${jours.map((d) => `<button role="tab" data-jour="${d}" aria-selected="${d === jourChoisi}">${esc(fmtJour(d, { weekday: "long" }).replace(/^./, (c) => c.toUpperCase()))}<small>${esc(fmtJour(d, { day: "numeric", month: "long" }))}</small></button>`).join("")}</div>
      <ol class="sessions">${sess.map((x, i) => `<li class="session ${etat(i)}"><time>${esc(x.heure)}</time><div><b>${esc(x.titre)}</b>${x.lieu ? `<small>${esc(x.lieu)}</small>` : ""}</div></li>`).join("")}</ol>`;
  }

  function planVue(_, params) {
    const cible = params.get("s");
    const ex = exposants();
    const cases = ex.map((e) => `<a class="case ${e.id === cible ? "cible" : ""} ${favs.has(e.id) ? "fav" : ""}" href="#/exposant/${encodeURIComponent(e.id)}"><span class="n">${esc(e.numero || "·")}</span><b>${esc(e.nom)}</b></a>`);
    const lignes = [];
    for (let i = 0; i < cases.length; i += 6) { lignes.push(cases.slice(i, i + 6).join("")); }
    const c = trouver(cible);
    return `<h1 class="titre-page">Plan du Village</h1>
      <p class="sous">${c ? `Le stand ${esc(c.numero)}, <b style="color:var(--clair)">${esc(c.nom)}</b>, est en surbrillance.` : "Touchez un stand pour voir sa fiche."}</p>
      <div class="plan"><div class="plan-grille">${lignes.join('<div class="allee">Allée</div>')}
        <div class="allee">Allée</div>
        <a class="case accueil" href="#/"><b>${esc(accueil()?.nom || "Accueil du Village")}</b><span class="sous" style="font-size:12px">Entrée</span></a>
      </div></div>
      <div class="legende"><span><i></i>Mes stands</span><span>Plan indicatif, à remplacer par le plan officiel.</span></div>`;
  }

  function favorisVue() {
    const ex = exposants().filter((e) => favs.has(e.id));
    return `<h1 class="titre-page">Mes stands</h1>
      ${ex.length ? `<p class="sous">${ex.length} stand${ex.length > 1 ? "s" : ""} gardé${ex.length > 1 ? "s" : ""} sur ce téléphone.</p><ol class="liste">${ex.map(ligneExposant).join("")}</ol>`
        : `<div class="astuce">Touchez l'étoile d'un exposant pour le retrouver ici. Sur un stand, scannez le code de la tablette : la fiche s'ouvre directement.</div>`}`;
  }

  /* ---------- Événements ---------- */
  document.addEventListener("click", async (ev) => {
    const fav = ev.target.closest("[data-fav]");
    if (fav) { ev.preventDefault(); ev.stopPropagation(); basculer(fav.dataset.fav); const y = scrollY; router(); scrollTo(0, y); if (!$("#liste")) return; filtrerListe(); return; }
    const th = ev.target.closest("[data-theme]");
    if (th) { filtre = th.dataset.theme; document.querySelectorAll("[data-theme]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.theme === filtre)); filtrerListe(); return; }
    const jb = ev.target.closest("[data-jour]");
    if (jb) { jourChoisi = jb.dataset.jour; location.hash = `#/programme?j=${jourChoisi}`; return; }
    const pa = ev.target.closest("[data-partager]");
    if (pa) { const e = trouver(pa.dataset.partager); try { await navigator.share({ title: e.nom, text: e.accroche || e.nom, url: location.href }); } catch {} }
  });
  document.addEventListener("input", (ev) => { if (ev.target.id === "q") { recherche = ev.target.value; filtrerListe(); } });
  window.addEventListener("hashchange", () => { router(); filtrerListe(); });

  const majHeure = () => document.querySelectorAll("[data-heure]").forEach((t) => (t.textContent = heure()));

  charger().then((c) => { cfg = c; router(); filtrerListe(); majHeure(); setInterval(majHeure, 20_000); })
    .catch(() => { $("#vue").innerHTML = '<p class="vide">Impossible de charger le Village. Vérifiez votre connexion puis rechargez la page.</p>'; });
  setInterval(async () => { try { const c = await charger(); if (c.version !== cfg.version) { cfg = c; const y = scrollY; router(); filtrerListe(); scrollTo(0, y); } } catch {} }, 120_000);
})();

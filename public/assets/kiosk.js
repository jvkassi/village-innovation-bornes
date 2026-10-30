/* Borne d'accueil — Le Village de l'Innovation
 *
 * /kiosk.html                 stand mémorisé sur la tablette (sinon : écran d'installation)
 * /kiosk.html?espace=<id>     force un stand
 * &demo=1                     minuteries courtes, sans télémétrie (page de revue)
 * &apercu=1                   aperçu du brouillon du back-office, mis à jour en direct
 * &veille=1                   démarre sur l'écran de veille
 */
(() => {
  const q = new URLSearchParams(location.search);
  const DEMO = q.has("demo");
  const MAQUETTE = q.has("maquette"); // page /maquettes : comportement réel, sans télémétrie
  // ?simule=2026-11-18T11:20 : horloge du Bénin positionnée au jour J (maquettes), qui continue de tourner
  const DECALAGE = (() => { const v = q.get("simule"); if (!v) return 0; const t = Date.parse(v + ":00+01:00"); return isNaN(t) ? 0 : t - Date.now(); })();
  const maintenant = () => new Date(Date.now() + DECALAGE);
  const APERCU = q.has("apercu");
  // Clé du brouillon prévisualisé : un par outil (gestion MTDI, espace exposant, maquettes) pour ne jamais se mélanger
  const CLE_BROUILLON = "village.brouillon" + (q.get("cle") ? "." + q.get("cle").replace(/[^a-z]/g, "") : "");
  const MESURE = !DEMO && !APERCU && !MAQUETTE;
  const FULLY = typeof window.fully !== "undefined";
  const DANS_UN_CADRE = window.self !== window.parent;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const absolue = (u) => new URL(u, location.origin).href;
  const lienApp = (id) => `${location.origin}/v/${id ? "#/exposant/" + encodeURIComponent(id) : ""}`;

  /* ---------- Pictogrammes (trait 1.5, grille 24) ---------- */
  const P = {
    plan: '<path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z"/><path d="M9 4v13.5M15 6.5V20"/>',
    building: '<path d="M4 20.5h16"/><path d="M6 20.5V5.5l7-2.5v17.5"/><path d="M13 9h5v11.5"/><path d="M9 8h1M9 11.5h1M9 15h1M16 12.5h-.01M16 16h-.01"/>',
    receipt: '<path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/>',
    doc: '<path d="M14 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3.5V8h4.5"/><path d="m9 14 2 2 4-4.5"/>',
    passport: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><circle cx="12" cy="10.5" r="3.2"/><path d="M8.8 10.5h6.4M12 7.3c1 .9 1.4 2 1.4 3.2s-.4 2.3-1.4 3.2c-1-.9-1.4-2-1.4-3.2s.4-2.3 1.4-3.2M9 17.5h6"/>',
    id: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><circle cx="9" cy="11" r="2.2"/><path d="M5.6 16.2c.6-1.6 1.9-2.4 3.4-2.4s2.8.8 3.4 2.4M14.5 10h4M14.5 13.5h3"/>',
    pulse: '<path d="M3 12h4l2.2-5.5 4.6 11 2.2-5.5h5"/>',
    leaf: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14"/><path d="M5 19 13 11"/>',
    wallet: '<path d="M4 7.5V18a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-3"/><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17v2.5"/><path d="M20 10.5h-4a2 2 0 0 0 0 4h4z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    route: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>',
    phone: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18h3"/>',
    school: '<path d="m2.5 9 9.5-5 9.5 5-9.5 5z"/><path d="M6.5 11v5c1.5 1.5 3.4 2.3 5.5 2.3s4-.8 5.5-2.3v-5M21.5 9v5.5"/>',
    chip: '<rect x="6.5" y="6.5" width="11" height="11" rx="1.5"/><path d="M9.5 3v3.5M14.5 3v3.5M9.5 17.5V21M14.5 17.5V21M3 9.5h3.5M3 14.5h3.5M17.5 9.5H21M17.5 14.5H21"/>',
    chat: '<path d="M4.5 5.5h15v10h-9l-4.5 3.5v-3.5h-1.5z"/><path d="M8.5 9.5h7M8.5 12.5h4"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.2-3.5-8.5s1.1-6.1 3.5-8.5"/>'
  };
  const picto = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${P[k] || P.globe}</svg>`;
  const marque = (s) => s.logo ? `<span class="pict puce"><img src="${esc(s.logo)}" alt=""></span>` : `<span class="pict">${picto(s.icone)}</span>`;
  const FLECHE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12h15M13.5 6l6 6-6 6"/></svg>';
  const qr = (texte) => { if (typeof qrcode !== "function") return ""; const g = qrcode(0, "M"); g.addData(texte); g.make(); return g.createSvgTag({ cellSize: 6, margin: 0, scalable: true }); };

  /* ---------- Mémoire de la tablette ---------- */
  const CLE = "village.borne";
  const memoire = (() => { try { return JSON.parse(localStorage.getItem(CLE)) || {}; } catch { return {}; } })();
  const sauver = () => { try { localStorage.setItem(CLE, JSON.stringify(memoire)); } catch {} };
  if (!memoire.id) { memoire.id = "t" + Math.random().toString(36).slice(2, 10); sauver(); }
  const jour = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Porto-Novo" }).format(maintenant());
  const heureMaintenant = () => new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Porto-Novo" }).format(maintenant());

  let cfg, espace, tInactif, tApp, tVeilleListe;
  let etat = "accueil"; // accueil | feuille | solution | veille
  let enAttente = null;
  let sessionOuverte = false;
  let clicsBloquesJusqua = 0;
  let filtre = "";

  /* ---------- Chargement et mises à jour ---------- */
  async function charger() {
    if (APERCU) { try { const b = JSON.parse(localStorage.getItem(CLE_BROUILLON)); if (b) return b; } catch {} }
    try {
      const r = await fetch("/api/config", { cache: "no-store" });
      if (!r.ok) throw 0;
      const c = await r.json();
      try { localStorage.setItem("village.config", JSON.stringify(c)); } catch {}
      reseau(true);
      return c;
    } catch {
      reseau(false);
      try { const c = JSON.parse(localStorage.getItem("village.config")); if (c) return c; } catch {}
      return (await fetch("/config/espaces.json")).json();
    }
  }
  function reseau(ok) { $("reseau").classList.toggle("masque", ok); }

  charger().then((c) => { cfg = c; demarrer(); }).catch(() => {
    document.body.insertAdjacentHTML("beforeend", '<div class="config"><h1>Contenu indisponible</h1><p>La borne n\'a pas pu charger ses contenus. Vérifiez le Wi-Fi de la tablette puis touchez l\'écran pour réessayer.</p></div>');
    document.addEventListener("click", () => location.reload(), { once: true });
  });

  function minuteries() {
    const m = cfg.minuteries || {};
    cfg.tRetour = (DEMO ? 25 : m.retourAccueilSecondes || 60) * 1000;
    cfg.tVeille = (DEMO ? 12 : m.veilleSecondes || 45) * 1000;
  }
  const visibles = () => (cfg.espaces || []).filter((e) => APERCU || e.actif !== false);

  function demarrer() {
    minuteries();
    horloge();
    const id = q.get("espace") || memoire.espace;
    espace = visibles().find((e) => e.id === id);
    if (!espace) return ecranInstallation(id);
    if (MESURE && q.get("espace") && memoire.espace !== espace.id) { memoire.espace = espace.id; sauver(); }
    rendre();
    ecouter();
    garderEcranAllume();
    if (q.has("veille")) entrerVeille(); else { balayer(); armer(); }
    if (MESURE) { battement(); setInterval(() => verifierMaj().finally(battement), 60_000); }
    if (APERCU) window.addEventListener("storage", (e) => { if (e.key === CLE_BROUILLON && e.newValue) appliquer(JSON.parse(e.newValue)); });
  }

  async function verifierMaj() {
    const c = await charger();
    if (!c || c.version === cfg.version) return;
    if (etat === "accueil" || etat === "veille") appliquer(c); else enAttente = c;
  }
  function appliquer(c) {
    cfg = c; minuteries();
    const e = visibles().find((x) => x.id === espace.id);
    if (!e) return location.reload();
    espace = e;
    rendre();
    if (etat === "accueil") balayer();
  }

  /* ---------- Heure du Bénin ---------- */
  function horloge() {
    const fh = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Porto-Novo" });
    const maj = () => { const d = maintenant(); document.querySelectorAll("[data-heure]").forEach((t) => { t.textContent = fh.format(d); t.dateTime = d.toISOString(); }); };
    maj(); setInterval(() => { maj(); if (espace?.type === "accueil" && etat !== "solution") rendreProgramme(); }, 30_000);
  }

  /* ---------- Rendu ---------- */
  const sols = () => (espace.solutions || []).slice(0, 4);
  const exposants = () => visibles().filter((e) => e.type !== "accueil").sort((a, b) => (parseInt(a.numero, 10) || 999) - (parseInt(b.numero, 10) || 999));

  function rendre() {
    const ev = cfg.evenement || {};
    const acc = espace.type === "accueil";
    $("ecran-exposant").classList.toggle("masque", acc);
    $("ecran-accueil").classList.toggle("masque", !acc);
    document.title = `${espace.nom} — ${ev.nom || "Le Village de l'Innovation"}`;
    acc ? rendreAccueil() : rendreExposant();
    $("veille-ici").textContent = acc ? (ev.edition || "") : (espace.numero ? `Stand ${espace.numero}` : "Vous êtes ici");
    $("veille-nom").textContent = acc ? (ev.nom || espace.nom) : espace.nom;
    $("veille-acc").textContent = acc ? (ev.accroche || "") : (espace.accroche || "");
    $("veille-liste").innerHTML = acc ? "" : sols().map((x) => `<li><span class="pict">${picto(x.icone)}</span>${esc(x.nom)}</li>`).join("");
  }

  const puces = (l, n) => (Array.isArray(l) ? l : []).slice(0, n).map((a) => `<li>${esc(a)}</li>`).join("");

  // Retire les dernières activités tant que l'écran déborde : la borne ne défile jamais.
  function ajuster() {
    const ec = $("ecran-exposant"), ul = $("ex-activites"), pres = $("ex-presentation");
    const deborde = () => ec.scrollHeight > ec.clientHeight + 1;
    ec.classList.remove("serre"); pres.classList.remove("masque");
    while (ul.children.length && deborde()) ul.lastElementChild.remove();
    if (deborde()) pres.classList.add("masque");
    if (deborde()) ec.classList.add("serre");
  }
  addEventListener("resize", () => { if (espace && espace.type !== "accueil") { $("ex-activites").innerHTML = puces(espace.activites, 4); ajuster(); } });

  function rendreExposant() {
    const e = espace, s = sols();
    $("ex-stand").textContent = e.numero ? `Stand ${e.numero}` : "";
    $("ex-logo").innerHTML = e.logo ? `<img src="${esc(e.logo)}" alt="">` : "";
    $("ex-theme").textContent = e.thematique || "";
    $("ex-nom").textContent = e.nom;
    $("ex-accroche").textContent = e.accroche || "";
    $("ex-presentation").textContent = e.presentation || "";
    $("ex-activites").innerHTML = puces(e.activites, 4);
    $("ex-essayer").classList.toggle("masque", !s.length);
    const nav = $("panneaux");
    nav.dataset.n = s.length;
    nav.innerHTML = s.map((x) => `
      <button class="panneau" data-id="${esc(x.id)}" aria-label="Essayer ${esc(x.nom)}">
        ${marque(x)}
        <span class="texte"><span class="nom">${esc(x.nom)}</span>${x.description ? `<span class="desc">${esc(x.description)}</span>` : ""}</span>
        <span class="aller">${x.type === "app" ? "Ouvrir" : "Essayer"}${FLECHE}</span>
      </button>`).join("");
    $("ex-qr").innerHTML = qr(lienApp(e.id));
    requestAnimationFrame(ajuster);
    let site = "";
    try { site = e.site ? new URL(e.site).hostname.replace(/^www\./, "") : ""; } catch {}
    $("ex-contact").textContent = [site, e.email, e.telephone].filter(Boolean).join("  ·  ");
  }

  function rendreAccueil() {
    const ev = cfg.evenement || {};
    $("ac-titre").textContent = espace.accroche || `Bienvenue au ${ev.nom || "Village de l'Innovation"}`;
    $("ac-texte").textContent = espace.presentation || "";
    $("ac-qr").innerHTML = qr(lienApp());
    rendreProgramme();
    const ex = exposants();
    $("ac-n").textContent = ex.length;
    const themes = [...new Set(ex.map((e) => e.thematique).filter(Boolean))];
    if (filtre && !themes.includes(filtre)) filtre = "";
    $("ac-filtres").innerHTML = themes.length > 1 ? [["", "Tous"], ...themes.map((t) => [t, t])].map(([v, l]) => `<button data-filtre="${esc(v)}" aria-pressed="${v === filtre}">${esc(l)}</button>`).join("") : "";
    $("ac-liste").innerHTML = ex.filter((e) => !filtre || e.thematique === filtre).map((e) => `
      <li><button data-ex="${esc(e.id)}"><span class="n">${esc(e.numero || "·")}</span><span><b>${esc(e.nom)}</b><small>${esc(e.accroche || e.thematique || "")}</small></span></button></li>`).join("");
  }

  function rendreProgramme() {
    const p = cfg.programme || [];
    if (!p.length) { $("ac-prog").innerHTML = ""; $("ac-prog-titre").textContent = ""; return; }
    const j = jour(), h = heureMaintenant();
    const jours = [...new Set(p.map((x) => x.jour))].sort();
    const cible = jours.includes(j) ? j : (jours.find((d) => d > j) || jours.at(-1));
    const duJour = p.filter((x) => x.jour === cible);
    const aVenir = cible === j ? duJour.filter((x) => x.heure >= h.slice(0, 5)) : duJour;
    const fmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
    $("ac-prog-titre").textContent = cible === j ? "Prochainement" : `Prochainement, ${fmt.format(new Date(cible + "T12:00:00Z"))}`;
    $("ac-prog").innerHTML = (aVenir.length ? aVenir : duJour.slice(-1)).slice(0, 1).map((x) => `<li><time>${esc(x.heure)}</time><div><b>${esc(x.titre)}</b>${x.lieu ? `<small>${esc(x.lieu)}</small>` : ""}</div></li>`).join("");
  }

  /* ---------- Interactions ---------- */
  function ecouter() {
    $("panneaux").addEventListener("click", (ev) => {
      const b = ev.target.closest(".panneau");
      if (!b || Date.now() < clicsBloquesJusqua) return;
      const s = sols().find((x) => x.id === b.dataset.id);
      if (!s) return;
      compter(s.id);
      b.classList.add("allume");
      setTimeout(() => { b.classList.remove("allume"); ouvrir(s); }, 140);
    });
    $("ac-filtres").addEventListener("click", (ev) => { const b = ev.target.closest("[data-filtre]"); if (!b) return; filtre = b.dataset.filtre; rendreAccueil(); });
    $("ac-liste").addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-ex]"); if (!b || Date.now() < clicsBloquesJusqua) return;
      const e = exposants().find((x) => x.id === b.dataset.ex); if (!e) return;
      compter("fiche:" + e.id);
      fiche(e);
    });
    $("feuille-fermer").addEventListener("click", (ev) => { ev.stopPropagation(); retourAccueil(); });
    $("feuille").addEventListener("click", (ev) => { if (ev.target === $("feuille")) retourAccueil(); });

    const actif = () => { if (etat !== "veille") armer(); };
    ["pointerdown", "keydown", "wheel", "scroll"].forEach((t) => window.addEventListener(t, actif, { passive: true, capture: true }));
    $("veille").addEventListener("pointerdown", sortirVeille);
    document.addEventListener("contextmenu", (e) => e.preventDefault());
    document.addEventListener("gesturestart", (e) => e.preventDefault());
    window.addEventListener("pageshow", (e) => { if (e.persisted) retourAccueil(true); });
  }

  /* Ouverture d'une solution : plein écran, sans cadre. Le navigateur kiosque gère le bouton Accueil,
     le retour après inactivité et l'effacement de la session. */
  function ouvrir(s) {
    if (s.type === "app") return ouvrirApp(s);
    const url = absolue(s.url);
    if (DEMO || APERCU || MAQUETTE || DANS_UN_CADRE) { window.open(url, "_blank", "noopener"); return; }
    etat = "solution";
    clearTimeout(tInactif);
    signalerSortie(s.id);
    if (FULLY) { try { fully.loadUrl(url); return; } catch {} }
    location.href = url;
  }

  function ouvrirApp(s) {
    const ios = /iPad|iPhone|Macintosh/.test(navigator.userAgent) && "ontouchend" in document;
    const lien = ios ? s.ios : s.android ? `intent://#Intent;package=${s.android};end` : null;
    if (lien && !DEMO && !APERCU && !MAQUETTE) {
      let parti = false;
      document.addEventListener("visibilitychange", () => { if (document.hidden) parti = true; }, { once: true });
      signalerSortie(s.id);
      if (FULLY && s.android) { try { fully.startApplication(s.android); } catch { location.href = lien; } } else location.href = lien;
      clearTimeout(tApp);
      tApp = setTimeout(() => { if (!parti) message(s.nom, "Cette application n'est pas installée sur cette tablette. Prévenez l'équipe du stand."); }, 2500);
      return;
    }
    message(s.nom, "Sur la borne, ce bouton lance directement l'application installée. Le bouton Accueil du navigateur kiosque ramène ensuite ici.");
  }

  function ouvrirFeuille() { etat = "feuille"; $("feuille").classList.add("ouverte"); $("feuille").setAttribute("aria-hidden", "false"); armer(); }
  function message(titre, texte) {
    ["f-stand", "f-theme", "f-accroche"].forEach((id) => ($(id).textContent = ""));
    $("f-titre").textContent = titre; $("f-texte").textContent = texte; $("f-activites").innerHTML = ""; $("f-qr").innerHTML = "";
    ouvrirFeuille();
  }
  function fiche(e) {
    $("f-stand").textContent = e.numero ? `Stand ${e.numero}` : "";
    $("f-theme").textContent = e.thematique || "";
    $("f-titre").textContent = e.nom;
    $("f-accroche").textContent = e.accroche || "";
    $("f-texte").textContent = e.presentation || "";
    $("f-activites").innerHTML = puces(e.activites, 3);
    $("f-qr").innerHTML = `<div class="qr">${qr(lienApp(e.id))}</div><small><b>Sur votre téléphone</b>La fiche, les contacts et le chemin jusqu'au stand${e.numero ? " " + esc(e.numero) : ""}.</small>`;
    ouvrirFeuille();
  }

  /* ---------- Retour et remise à zéro ---------- */
  function retourAccueil(auto) {
    clearTimeout(tApp);
    $("feuille").classList.remove("ouverte"); $("feuille").setAttribute("aria-hidden", "true");
    try { sessionStorage.clear(); } catch {}
    if (FULLY) { try { fully.clearCookies(); fully.clearWebstorage(); fully.clearFormData(); fully.clearCache(); } catch {} }
    if (auto) sessionOuverte = false;
    etat = "accueil";
    if (espace?.type === "accueil") { filtre = ""; const l = $("ac-liste"); if (l) l.scrollTop = 0; }
    if (enAttente) { const c = enAttente; enAttente = null; appliquer(c); } else if (espace?.type === "accueil") rendreAccueil();
    armer();
  }

  /* ---------- Inactivité : retour silencieux, puis veille ---------- */
  function armer() {
    clearTimeout(tInactif);
    if (etat === "veille" || APERCU) return;
    tInactif = etat === "accueil" ? setTimeout(entrerVeille, cfg.tVeille) : setTimeout(() => retourAccueil(true), cfg.tRetour);
  }
  function entrerVeille() {
    if (etat !== "accueil") retourAccueil(true);
    sessionOuverte = false;
    etat = "veille";
    clearTimeout(tInactif);
    $("veille").classList.add("active");
    $("veille").setAttribute("aria-hidden", "false");
    let i = 0;
    clearInterval(tVeilleListe);
    const pas = () => { const items = [...$("veille-liste").children]; items.forEach((li, k) => li.classList.toggle("vif", items.length < 2 || k === i % items.length)); i++; };
    pas(); tVeilleListe = setInterval(pas, 2600);
  }
  function sortirVeille(ev) {
    ev.preventDefault();
    clicsBloquesJusqua = Date.now() + 600;
    clearInterval(tVeilleListe);
    $("veille").classList.remove("active");
    $("veille").setAttribute("aria-hidden", "true");
    etat = "accueil";
    ouvrirSession();
    balayer();
    armer();
  }
  function balayer() { const b = $("balayage"); b.classList.remove("joue"); void b.offsetWidth; b.classList.add("joue"); }

  /* ---------- Mesure d'audience (anonyme) ---------- */
  function ouvrirSession() {
    if (!MESURE || sessionOuverte) return;
    sessionOuverte = true;
    const d = jour();
    memoire.sessions = memoire.sessions || {};
    memoire.sessions[d] = (memoire.sessions[d] || 0) + 1;
    nettoyer(); sauver();
  }
  function compter(id) {
    if (!MESURE) return;
    ouvrirSession();
    const d = jour();
    memoire.touches = memoire.touches || {};
    memoire.touches[d] = memoire.touches[d] || {};
    memoire.touches[d][id] = (memoire.touches[d][id] || 0) + 1;
    sauver();
  }
  function nettoyer() {
    for (const k of ["touches", "sessions"]) { const o = memoire[k] || {}; Object.keys(o).sort().slice(0, -7).forEach((d) => delete o[d]); }
  }
  function appareil() {
    const ua = navigator.userAgent;
    const os = /iPad|Macintosh/.test(ua) && "ontouchend" in document ? "iPad" : /Android ([\d.]+)/.test(ua) ? "Android " + RegExp.$1 : /iPhone/.test(ua) ? "iPhone" : /Windows/.test(ua) ? "Windows" : "Autre";
    const modele = (ua.match(/Android [\d.]+; ([^;)]+)/) || [])[1];
    return [FULLY ? "Fully Kiosk" : /CriOS|Chrome/.test(ua) ? "Chrome" : /Safari/.test(ua) ? "Safari" : "Navigateur", os, modele && modele !== "K" ? modele : ""].filter(Boolean).join(" · ");
  }
  function corpsPing(ecran, solution, batterie = null, enCharge = false) {
    return { id: memoire.id, nom: memoire.nom || "", espace: espace.id, ecran, solution: solution || "", version: cfg.version || 0,
      batterie, enCharge, navigateur: appareil(), largeur: innerWidth, hauteur: innerHeight, touches: memoire.touches || {}, sessions: memoire.sessions || {} };
  }
  function signalerSortie(id) {
    if (!MESURE) return;
    try { navigator.sendBeacon("/api/ping", new Blob([JSON.stringify(corpsPing("solution", id))], { type: "application/json" })); } catch {}
  }
  async function battement() {
    let batterie = null, enCharge = false;
    try {
      if (FULLY) { batterie = fully.getBatteryLevel(); enCharge = fully.isPlugged(); }
      else if (navigator.getBattery) { const b = await navigator.getBattery(); batterie = Math.round(b.level * 100); enCharge = b.charging; }
    } catch {}
    try {
      const r = await fetch("/api/ping", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpsPing(etat, "", batterie, enCharge)), keepalive: true });
      reseau(r.ok);
    } catch { reseau(false); }
  }

  function garderEcranAllume() {
    if (!("wakeLock" in navigator)) return;
    const d = () => navigator.wakeLock.request("screen").catch(() => {});
    d(); document.addEventListener("visibilitychange", () => { if (!document.hidden) d(); });
  }

  /* ---------- Installation de la tablette (une fois) ---------- */
  function ecranInstallation(demande) {
    const liste = visibles();
    document.body.insertAdjacentHTML("beforeend", `
      <div class="config">
        <div class="logo logo-side" role="img" aria-label="Le Village de l'Innovation"></div>
        <h1>Installer cette tablette</h1>
        <p>${demande ? "Le stand demandé n'existe plus ou est masqué. " : ""}Choisissez le stand où la tablette est posée. Elle le gardera en mémoire, même après redémarrage.</p>
        <label>Nom de la tablette (pour la repérer dans le suivi)
          <input id="nom-tablette" value="${esc(memoire.nom || "")}" placeholder="Ex. Stand 4, tablette gauche" autocomplete="off">
        </label>
        <ul>${liste.map((e) => `<li><button data-id="${esc(e.id)}">${e.type === "accueil" ? "★" : esc(e.numero || "–")}. ${esc(e.nom)}<span>${e.type === "accueil" ? "Accueil" : esc(e.thematique || "")}</span></button></li>`).join("")}</ul>
      </div>`);
    document.querySelector(".config ul").addEventListener("click", (ev) => {
      const b = ev.target.closest("button[data-id]"); if (!b) return;
      memoire.espace = b.dataset.id; memoire.nom = $("nom-tablette").value.trim().slice(0, 60); sauver();
      location.href = "/kiosk.html";
    });
  }

  if ("serviceWorker" in navigator && MESURE && !DECALAGE) navigator.serviceWorker.register("/sw.js").catch(() => {});
})();

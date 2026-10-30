/* Back-office des bornes — Le Village de l'Innovation */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const copie = (o) => JSON.parse(JSON.stringify(o));
  const fmtHeure = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Porto-Novo" });
  const fmtJour = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  // ?maquette=1 : démonstration sans connexion ni écriture, avec des données d'exemple (vitrine)
  const MAQUETTE = new URLSearchParams(location.search).has("maquette");
  const CLE = MAQUETTE ? "village.brouillon.maquette" : "village.brouillon";
  const jour = () => (MAQUETTE ? "2026-11-18" : new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Porto-Novo" }).format(new Date()));

  const PICTOS = {
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.2-3.5-8.5s1.1-6.1 3.5-8.5"/>',
    doc: '<path d="M14 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3.5V8h4.5"/><path d="m9 14 2 2 4-4.5"/>',
    id: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><circle cx="9" cy="11" r="2.2"/><path d="M5.6 16.2c.6-1.6 1.9-2.4 3.4-2.4s2.8.8 3.4 2.4M14.5 10h4M14.5 13.5h3"/>',
    passport: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><circle cx="12" cy="10.5" r="3.2"/><path d="M8.8 10.5h6.4M9 17.5h6"/>',
    building: '<path d="M4 20.5h16"/><path d="M6 20.5V5.5l7-2.5v17.5"/><path d="M13 9h5v11.5"/><path d="M9 8h1M9 11.5h1M9 15h1"/>',
    receipt: '<path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/>',
    wallet: '<path d="M4 7.5V18a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-3"/><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17v2.5"/><path d="M20 10.5h-4a2 2 0 0 0 0 4h4z"/>',
    pulse: '<path d="M3 12h4l2.2-5.5 4.6 11 2.2-5.5h5"/>',
    leaf: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14"/><path d="M5 19 13 11"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    route: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>',
    school: '<path d="m2.5 9 9.5-5 9.5 5-9.5 5z"/><path d="M6.5 11v5c1.5 1.5 3.4 2.3 5.5 2.3s4-.8 5.5-2.3v-5M21.5 9v5.5"/>',
    chip: '<rect x="6.5" y="6.5" width="11" height="11" rx="1.5"/><path d="M9.5 3v3.5M14.5 3v3.5M9.5 17.5V21M14.5 17.5V21M3 9.5h3.5M3 14.5h3.5M17.5 9.5H21M17.5 14.5H21"/>',
    chat: '<path d="M4.5 5.5h15v10h-9l-4.5 3.5v-3.5h-1.5z"/><path d="M8.5 9.5h7M8.5 12.5h4"/>',
    phone: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18h3"/>',
    plan: '<path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z"/><path d="M9 4v13.5M15 6.5V20"/>'
  };
  const picto = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${PICTOS[k] || PICTOS.globe}</svg>`;
  const I = {
    haut: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 15 6-6 6 6"/></svg>',
    bas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>',
    suppr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/></svg>'
  };

  let publie = null, brouillon = null, sel = 0, tablettes = [], vues = [], tSuivi, comptes = [], demandes = [];

  /* ---------- API ---------- */
  async function api(url, opts = {}) {
    if (MAQUETTE) return apiMaquette(url, opts);
    const r = await fetch(url, { credentials: "same-origin", ...opts, headers: { "Content-Type": "application/json", ...(opts.headers || {}) } });
    const d = await r.json().catch(() => ({}));
    if (r.status === 401) { afficherConnexion(); throw new Error(d.erreur || "Session expirée"); }
    if (!r.ok) throw Object.assign(new Error(d.erreur || "Erreur " + r.status), { donnees: d });
    return d;
  }
  function toast(t) { const e = $("#toast"); e.textContent = t; e.classList.add("visible"); clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove("visible"), 3800); }

  /* ---------- Connexion ---------- */
  function afficherConnexion() { $("#app").hidden = true; $("#connexion").hidden = false; $("#mdp").focus(); }
  $("#form-connexion").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("#err-connexion").textContent = "";
    try { await api("/api/admin/session", { method: "POST", body: JSON.stringify({ motDePasse: $("#mdp").value }) }); $("#mdp").value = ""; demarrer(); }
    catch (err) { $("#err-connexion").textContent = err.message; }
  });
  $("#btn-sortir").addEventListener("click", async () => { await api("/api/admin/session", { method: "DELETE" }).catch(() => {}); afficherConnexion(); });

  if (MAQUETTE) setTimeout(demarrer); // après la définition des données d'exemple, en fin de fichier
  else fetch("/api/admin/session").then((r) => r.json()).then((s) => (s.connecte ? demarrer() : afficherConnexion())).catch(afficherConnexion);

  async function demarrer() {
    $("#connexion").hidden = true; $("#app").hidden = false;
    publie = await api("/api/admin/config");
    let b = null;
    try { b = JSON.parse(localStorage.getItem(CLE)); } catch {}
    brouillon = b && b._base === (publie.version || 0) ? b : { ...copie(publie), _base: publie.version || 0 };
    (brouillon.espaces || []).forEach((e) => { e.solutions = e.solutions || []; });
    rendreTout();
    chargerSuivi(); await chargerExposants();
    const og = new URLSearchParams(location.search).get("onglet");
    if (og) $(`.onglets [data-onglet="${og.replace(/[^a-z]/g, "")}"]`)?.click();
    clearInterval(tSuivi); tSuivi = setInterval(() => { chargerSuivi(); chargerExposants(); }, 30_000);
  }

  /* ---------- Brouillon ---------- */
  const propre = (c) => JSON.stringify({ evenement: c.evenement, minuteries: c.minuteries, programme: c.programme || [], espaces: c.espaces });
  let tSauve;
  function modifie({ liste = true } = {}) {
    clearTimeout(tSauve);
    tSauve = setTimeout(() => { try { localStorage.setItem(CLE, JSON.stringify(brouillon)); } catch {} }, 150);
    etatPublication();
    if (liste) rendreListe();
  }
  function etatPublication() {
    const sale = propre(brouillon) !== propre(publie);
    $("#btn-publier").disabled = !sale;
    const e = $("#etat-pub");
    e.classList.toggle("modifie", sale);
    e.textContent = sale ? "Modifications non publiées" : publie.publieLe ? `Publié le ${fmtHeure.format(new Date(publie.publieLe))}` : "Contenu d'exemple, jamais publié";
  }

  /* ---------- Onglets ---------- */
  $$(".onglets button").forEach((b) => b.addEventListener("click", () => {
    $$(".onglets button").forEach((x) => x.setAttribute("aria-selected", x === b));
    $$(".onglet").forEach((o) => (o.hidden = o.id !== "onglet-" + b.dataset.onglet));
    if (b.dataset.onglet === "suivi") chargerSuivi();
    if (b.dataset.onglet === "demandes") chargerExposants();
  }));

  function rendreTout() { rendreListe(); rendreEdition(); rendreReglages(); rendreProgramme(); etatPublication(); }

  /* ---------- Programme ---------- */
  const JOURS = [["2026-11-18", "Mercredi 18 novembre"], ["2026-11-19", "Jeudi 19 novembre"], ["2026-11-20", "Vendredi 20 novembre"]];
  function rendreProgramme() {
    brouillon.programme = brouillon.programme || [];
    $("#prog-lignes").innerHTML = brouillon.programme.map((p, i) => `<tr data-p="${i}">
      <td class="j"><select data-kp="jour">${JOURS.map(([v, l]) => `<option value="${v}" ${p.jour === v ? "selected" : ""}>${l}</option>`).join("")}</select></td>
      <td class="h"><input data-kp="heure" value="${esc(p.heure)}" placeholder="10:00" maxlength="5"></td>
      <td><input data-kp="titre" value="${esc(p.titre)}" maxlength="120"></td>
      <td><input data-kp="lieu" value="${esc(p.lieu)}" maxlength="80" list="lieux"></td>
      <td class="x"><button class="btn icone danger" data-suppr-p title="Retirer">${I.suppr}</button></td></tr>`).join("") +
      `<datalist id="lieux">${brouillon.espaces.map((e) => `<option value="${esc(e.type === "accueil" ? e.nom : "Stand " + e.nom)}">`).join("")}</datalist>`;
  }
  $("#prog-lignes").addEventListener("input", (ev) => {
    const t = ev.target, tr = t.closest("[data-p]"); if (!tr || !t.dataset.kp) return;
    brouillon.programme[+tr.dataset.p][t.dataset.kp] = t.value; modifie({ liste: false });
  });
  $("#prog-lignes").addEventListener("change", (ev) => { if (ev.target.tagName === "SELECT") { const tr = ev.target.closest("[data-p]"); brouillon.programme[+tr.dataset.p].jour = ev.target.value; modifie({ liste: false }); } });
  $("#prog-lignes").addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-suppr-p]"); if (!b) return;
    brouillon.programme.splice(+b.closest("[data-p]").dataset.p, 1); modifie({ liste: false }); rendreProgramme();
  });
  $("#btn-ajout-session").addEventListener("click", () => {
    const der = brouillon.programme.at(-1);
    brouillon.programme.push({ jour: der?.jour || JOURS[0][0], heure: "", titre: "", lieu: "" });
    modifie({ liste: false }); rendreProgramme();
    $("#prog-lignes tr:last-child [data-kp=heure]").focus();
  });

  /* ---------- Liste des stands ---------- */
  function rendreListe() {
    const es = brouillon.espaces;
    $("#n-stands").textContent = es.length;
    $("#liste-stands").innerHTML = es.map((e, i) => {
      const err = !e.nom || e.solutions.some((s) => !s.nom || (s.type === "web" ? !/^https:\/\/.+\..+|^\//.test(s.url || "") : !(s.android || s.ios)));
      return `<li><button data-i="${i}" aria-current="${i === sel}">
        <span class="n">${e.type === "accueil" ? "★" : esc(e.numero || "–")}</span>
        <span><span class="t">${esc(e.nom || "Sans nom")}</span><span class="c">${e.type === "accueil" ? "Tablette d'accueil" : esc(e.thematique || "Sans thématique")} · ${e.solutions.length} à essayer${e.actif === false ? ' · <span class="masque-tag">masqué</span>' : ""}</span></span>
        ${err ? '<span class="err" title="À compléter">●</span>' : ""}
      </button></li>`;
    }).join("");
  }
  $("#liste-stands").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    sel = +b.dataset.i; rendreListe(); rendreEdition();
  });
  $("#btn-ajout-stand").addEventListener("click", () => {
    if (brouillon.espaces.length >= 40) return toast("40 espaces au maximum.");
    const nums = brouillon.espaces.map((x) => parseInt(x.numero, 10)).filter((n) => n > 0);
    brouillon.espaces.push({ id: "stand-" + Math.random().toString(36).slice(2, 7), type: "exposant", numero: String((nums.length ? Math.max(...nums) : 0) + 1),
      nom: "Nouvel exposant", thematique: "", accroche: "", presentation: "", site: "", email: "", telephone: "", logo: "", consigne: "", actif: true,
      solutions: [{ id: "s" + Math.random().toString(36).slice(2, 7), nom: "", porteur: "", description: "", type: "web", url: "https://", icone: "globe", logo: "" }] });
    sel = brouillon.espaces.length - 1;
    modifie(); rendreEdition();
    setTimeout(() => { const n = $('#edition [data-k="nom"]'); n.focus(); n.select(); }, 30);
  });

  /* ---------- Édition d'un stand ---------- */
  function rendreEdition() {
    const e = brouillon.espaces[sel];
    if (!e) { $("#edition").innerHTML = '<p class="vide">Ajoutez un premier espace.</p>'; return apercu(); }
    const n = e.solutions.length;
    $("#edition").innerHTML = `
      <div class="edition-tete">
        <h1>${esc(e.nom || "Sans nom")}</h1>
        <div class="outils">
          <button class="btn" data-action="installer">Installer sur une tablette</button>
          <button class="btn icone" data-action="monter" title="Monter dans la liste" ${sel === 0 ? "disabled" : ""}>${I.haut}</button>
          <button class="btn icone" data-action="descendre" title="Descendre dans la liste" ${sel === brouillon.espaces.length - 1 ? "disabled" : ""}>${I.bas}</button>
          <button class="btn icone danger" data-action="supprimer" title="Supprimer l'espace">${I.suppr}</button>
        </div>
      </div>
      <div class="bloc">
        <div class="segment" role="radiogroup" aria-label="Type de tablette" style="margin-bottom:14px">
          <button role="radio" aria-checked="${e.type !== "accueil"}" data-typestand="exposant">Espace d'exposant</button>
          <button role="radio" aria-checked="${e.type === "accueil"}" data-typestand="accueil">Tablette d'accueil</button>
        </div>
        ${e.type === "accueil" ? `
        <div class="champs">
          <label class="large">Titre<input data-k="nom" value="${esc(e.nom)}" maxlength="60"></label>
          <label class="large">Accroche<input data-k="accroche" value="${esc(e.accroche)}" maxlength="90"></label>
          <label class="large">Texte d'accueil<textarea data-k="presentation" maxlength="600" rows="2">${esc(e.presentation)}</textarea></label>
          <label class="interrupteur large"><input type="checkbox" data-k="actif" ${e.actif !== false ? "checked" : ""}> Afficher sur les bornes</label>
        </div>
        <small class="aide">La tablette d'accueil affiche l'annuaire des exposants, le programme du jour et le QR code de l'application visiteur.</small>` : `
        <div class="champs">
          <label>Nom de l'exposant<input data-k="nom" value="${esc(e.nom)}" maxlength="60"></label>
          <div class="champs-mini">
            <label>N° de stand<input data-k="numero" value="${esc(e.numero)}" maxlength="8" placeholder="12"></label>
            <label>Thématique<input data-k="thematique" value="${esc(e.thematique)}" maxlength="40" list="thematiques" placeholder="Services publics"></label>
          </div>
          <div class="large"><span class="etiquette">Tablette de cet espace</span>
            <div class="segment" role="radiogroup" aria-label="Tablette de cet espace">
              <button role="radio" aria-checked="${e.plateforme === "android"}" data-plateforme="android">Android</button>
              <button role="radio" aria-checked="${e.plateforme === "ipad"}" data-plateforme="ipad">iPad</button>
              <button role="radio" aria-checked="${!e.plateforme}" data-plateforme="">À préciser</button>
            </div>
            <small class="aide">${e.plateforme === "ipad" ? "Sur iPad, la borne n'ouvre que des applications web. Une application à installer doit aller sur une tablette Android, passer par sa version web, ou avoir son propre iPad sans borne." : e.plateforme === "android" ? "Sur Android, la borne ouvre les sites et les applications installées." : "Le modèle de tablette sera connu avec l'inventaire du 6 novembre."}</small>
          </div>
          <label class="large">Accroche <small>une ligne, affichée en grand</small><input data-k="accroche" value="${esc(e.accroche)}" maxlength="90" placeholder="Ce que l'exposant apporte, en une phrase."></label>
          <label class="large">Nom complet <small>dans l'application visiteur</small><input data-k="nomComplet" value="${esc(e.nomComplet || "")}" maxlength="140" placeholder="Agence nationale d'…"></label>
          <label class="large">Présentation <small>3 phrases au plus</small><textarea data-k="presentation" maxlength="700" rows="3">${esc(e.presentation)}</textarea></label>
          <label class="large">Ce que fait l'exposant <small>une activité par ligne, 6 au plus ; les 4 premières sur la borne</small><textarea data-kl="activites" rows="4" placeholder="Délivrance de la carte d'identité biométrique">${esc((e.activites || []).join("\n"))}</textarea></label>
          <label class="large">Repères <small>un par ligne : texte | https://source</small><textarea data-kl="reperes" rows="2" placeholder="Créée par la loi n° … | https://…">${esc((e.reperes || []).map((r) => r.texte + (r.source ? " | " + r.source : "")).join("\n"))}</textarea></label>
          <label>Site web<input type="url" data-k="site" value="${esc(e.site)}" placeholder="https://"></label>
          <label>E-mail de contact<input type="email" data-k="email" value="${esc(e.email)}" placeholder="contact@exemple.bj"></label>
          <label>Téléphone<input data-k="telephone" value="${esc(e.telephone)}" placeholder="+229 …"></label>
          <label>Logo de l'exposant
            <span class="url-ligne">${e.logo ? `<img class="logo-mini" src="${esc(e.logo)}" alt="">` : ""}<button class="btn" data-action="logo-stand">${e.logo ? "Changer" : "Envoyer un logo"}</button>${e.logo ? '<button class="btn" data-action="logo-stand-retirer">Retirer</button>' : ""}</span>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden data-fichier-stand="logo"></label>
          <label>Image ou capture <small>affichée sur la fiche téléphone</small>
            <span class="url-ligne">${e.image ? `<img class="logo-mini" src="${esc(e.image)}" alt="">` : ""}<button class="btn" data-action="image-stand">${e.image ? "Changer" : "Envoyer une image"}</button>${e.image ? '<button class="btn" data-action="image-stand-retirer">Retirer</button>' : ""}</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" hidden data-fichier-stand="image"></label>
          <label class="interrupteur large"><input type="checkbox" data-k="actif" ${e.actif !== false ? "checked" : ""}> Afficher cet espace sur les bornes et dans l'application</label>
        </div>`}
      </div>
      ${e.type === "accueil" ? "" : blocAcces(e)}
      ${e.type === "accueil" ? "" : `
      <h2 class="sous-titre">À essayer sur la borne <small>${n} sur 4</small></h2>
      ${e.solutions.map((s, j) => blocSolution(s, j, n)).join("")}
      ${n < 4 ? '<button class="ajout-solution" data-action="ajout-solution">Ajouter une solution à essayer</button>' : ""}`}
      <datalist id="thematiques">${[...new Set(brouillon.espaces.map((x) => x.thematique).filter(Boolean))].map((t) => `<option value="${esc(t)}">`).join("")}</datalist>`;
    apercu();
  }

  /* ---------- Accès exposant (comptes e-mail + mot de passe) ---------- */
  function blocAcces(e) {
    const cs = comptes.filter((c) => c.espace === e.id);
    const enAttente = demandes.find((d) => d.espace === e.id && d.statut === "en_attente");
    return `<div class="bloc acces-bloc">
      <h3>Accès exposant <small>l'exposant met à jour sa fiche ; vous validez avant publication</small></h3>
      ${enAttente ? `<p class="avertissement">Une demande de modification attend votre validation. <button class="lien" data-action="voir-demandes">Voir la demande</button></p>` : ""}
      ${cs.length ? `<ul class="comptes">${cs.map((c) => `<li><span><b>${esc(c.email)}</b><small>${c.provisoire ? "Mot de passe provisoire, jamais connecté" : c.vuLe ? "Dernière connexion le " + fmtHeure.format(new Date(c.vuLe)) : "Actif"}</small></span>
        <button class="btn" data-action="acces-reinit" data-email="${esc(c.email)}">Nouveau mot de passe</button>
        <button class="btn icone danger" data-action="acces-suppr" data-email="${esc(c.email)}" title="Retirer l'accès">${I.suppr}</button></li>`).join("")}</ul>` : '<p class="aide" style="margin:0 0 10px">Aucun accès pour ce stand.</p>'}
      <span class="url-ligne"><input type="email" id="acces-email" placeholder="contact@exposant.bj" value="${esc(cs.length ? "" : e.email || "")}"><button class="btn" data-action="acces-creer">Créer un accès</button></span>
    </div>`;
  }
  function montrerAcces(e, r) {
    const lien = `${location.origin}/exposant`;
    $("#acces-texte").textContent = `Bonjour,

Votre accès à l'espace exposant du Village de l'Innovation (stand ${e.numero || ""} — ${e.nom}) :

Adresse : ${lien}
E-mail : ${r.email}
Mot de passe provisoire : ${r.motDePasse}

Vous choisirez votre mot de passe à la première connexion. Vos modifications sont publiées sur les tablettes après validation par l'équipe du Village.`;
    $("#dlg-acces").showModal();
  }
  $("#btn-copier-acces").addEventListener("click", () => navigator.clipboard.writeText($("#acces-texte").textContent).then(() => toast("Message copié.")));

  /* ---------- Demandes des exposants ---------- */
  async function chargerExposants() {
    try {
      const d = await api("/api/admin/exposants");
      comptes = d.comptes || []; demandes = d.demandes || [];
      const n = demandes.filter((x) => x.statut === "en_attente").length;
      $("#n-demandes").textContent = n || "";
      rendreDemandes();
      const b = $(".acces-bloc"); const e = brouillon?.espaces[sel];
      if (b && e && !b.contains(document.activeElement)) b.outerHTML = blocAcces(e);
    } catch {}
  }
  const LIBELLES = { nomComplet: "Nom complet", accroche: "Accroche", presentation: "Présentation", activites: "Activités", reperes: "Repères", site: "Site web", email: "E-mail", telephone: "Téléphone", logo: "Logo", image: "Image", solutions: "Solutions à essayer" };
  function valeur(k, v) {
    if (k === "logo" || k === "image") return v ? `<img class="diff-img" src="${esc(v)}" alt="">` : "<i>aucun</i>";
    if (k === "activites") return (v || []).length ? `<ul>${v.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>` : "<i>aucune</i>";
    if (k === "reperes") return (v || []).length ? `<ul>${v.map((r) => `<li>${esc(r.texte)}${r.source ? ` <a href="${esc(r.source)}" target="_blank" rel="noopener">source</a>` : ""}</li>`).join("")}</ul>` : "<i>aucun</i>";
    if (k === "solutions") return (v || []).length ? `<ul>${v.map((x) => `<li><b>${esc(x.nom)}</b> — ${x.type === "app" ? "application " + esc(x.android || "") : `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.url)}</a>`}</li>`).join("")}</ul>` : "<i>aucune</i>";
    return v ? esc(v) : "<i>vide</i>";
  }
  function carteDemande(d, actions) {
    const e = publie.espaces.find((x) => x.id === d.espace) || { nom: d.espace };
    const diffs = Object.keys(LIBELLES).filter((k) => k in d.doc && JSON.stringify(d.doc[k] ?? "") !== JSON.stringify(e[k] ?? ""));
    return `<article class="demande" data-id="${d.id}">
      <header><div><b>${esc(e.nom)}</b>${e.numero ? ` <span class="tag">Stand ${esc(e.numero)}</span>` : ""}<small>${esc(d.email)} · envoyée le ${fmtHeure.format(new Date(d.soumisLe))}</small></div>
        ${actions ? `<div class="outils"><button class="btn" data-refuser="${d.id}">Refuser</button><button class="btn principal" data-accepter="${d.id}">Valider et publier</button></div>`
          : `<span class="statut-d ${d.statut}">${d.statut === "acceptee" ? "Validée" : "Refusée"}${d.traiteLe ? " le " + fmtHeure.format(new Date(d.traiteLe)) : ""}${d.motif ? " · " + esc(d.motif) : ""}</span>`}</header>
      ${actions ? (diffs.length ? `<table class="diff"><thead><tr><th></th><th>En ligne</th><th>Proposé</th></tr></thead><tbody>${diffs.map((k) => `<tr><th>${LIBELLES[k]}</th><td>${valeur(k, e[k])}</td><td class="nouveau">${valeur(k, d.doc[k])}</td></tr>`).join("")}</tbody></table>` : '<p class="aide">Aucune différence avec la fiche en ligne.</p>') : ""}
    </article>`;
  }
  function rendreDemandes() {
    if (!publie) return;
    const att = demandes.filter((d) => d.statut === "en_attente"), tr = demandes.filter((d) => d.statut !== "en_attente");
    $("#liste-demandes").innerHTML = att.length ? att.map((d) => carteDemande(d, true)).join("") : '<p class="vide-d">Aucune demande en attente.</p>';
    $("#liste-traitees").innerHTML = tr.length ? tr.map((d) => carteDemande(d, false)).join("") : '<p class="vide-d">Rien pour l\'instant.</p>';
  }
  $("#onglet-demandes").addEventListener("click", async (ev) => {
    const ac = ev.target.closest("[data-accepter]"), rf = ev.target.closest("[data-refuser]");
    if (!ac && !rf) return;
    const id = +(ac || rf).dataset[ac ? "accepter" : "refuser"];
    try {
      if (rf) {
        const motif = prompt("Motif du refus, transmis à l'exposant (facultatif) :");
        if (motif === null) return;
        await api("/api/admin/exposants", { method: "POST", body: JSON.stringify({ action: "refuser", id, motif }) });
        toast("Demande refusée. L'exposant voit le motif dans son espace.");
      } else {
        const d = demandes.find((x) => x.id === id);
        publie = await api("/api/admin/exposants", { method: "POST", body: JSON.stringify({ action: "accepter", id }) });
        // Le brouillon en cours reçoit la fiche publiée de ce stand, le reste est conservé
        const ep = publie.espaces.find((x) => x.id === d.espace);
        const i = brouillon.espaces.findIndex((x) => x.id === d.espace);
        if (ep && i >= 0) brouillon.espaces[i] = copie(ep);
        brouillon._base = publie.version;
        modifie(); rendreTout();
        toast("Validé et publié. Les tablettes affichent la nouvelle fiche d'ici une minute.");
      }
      chargerExposants();
    } catch (e) {
      const errs = e.donnees?.erreurs;
      if (errs?.length) { $("#liste-erreurs").innerHTML = errs.map((x) => `<li>${esc(x)}</li>`).join(""); $("#dlg-erreurs").showModal(); } else toast(e.message);
    }
  });

  function blocSolution(s, j, n) {
    const web = s.type !== "app";
    return `
    <div class="solution" data-s="${j}">
      <div class="solution-tete">
        <span class="ordre">${j + 1}</span><b>${esc(s.nom || "Nouvelle solution")}</b>
        <button class="btn icone" data-action="sol-monter" title="Monter" ${j === 0 ? "disabled" : ""}>${I.haut}</button>
        <button class="btn icone" data-action="sol-descendre" title="Descendre" ${j === n - 1 ? "disabled" : ""}>${I.bas}</button>
        <button class="btn icone danger" data-action="sol-supprimer" title="Retirer la solution">${I.suppr}</button>
      </div>
      <div class="solution-corps">
        <div class="visuel">
          <div class="vignette ${s.logo ? "avec-logo" : ""}" data-action="logo" title="Changer le visuel">${s.logo ? `<img src="${esc(s.logo)}" alt="">` : picto(s.icone)}</div>
          <div class="liens"><button data-action="logo">Logo</button>${s.logo ? '<button data-action="logo-retirer">Retirer</button>' : '<button data-action="pictos">Icône</button>'}</div>
          <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden data-fichier>
          <div class="pictos">${Object.keys(PICTOS).map((k) => `<button data-picto="${k}" aria-pressed="${k === s.icone}" title="${k}">${picto(k)}</button>`).join("")}</div>
        </div>
        <div class="champs">
          <label class="large">Nom affiché<input data-ks="nom" value="${esc(s.nom)}" maxlength="60" placeholder="Ex. e-Visa Bénin"></label>
          <label class="large">Description courte<input data-ks="description" value="${esc(s.description)}" maxlength="160" placeholder="Une phrase : ce que le visiteur peut faire."></label>
          <div class="large">
            <div class="segment" role="radiogroup" aria-label="Type">
              <button role="radio" aria-checked="${web}" data-type="web">Site web</button>
              <button role="radio" aria-checked="${!web}" data-type="app">Application installée</button>
            </div>
          </div>
          ${web ? `
          <label class="large">Adresse du site
            <span class="url-ligne"><input type="url" data-ks="url" value="${esc(s.url)}" placeholder="https://"><button class="btn" data-action="verifier">Vérifier</button><button class="btn" data-action="tester">Ouvrir</button></span>
            <span class="verif" data-verif></span>
          </label>` : `
          ${brouillon.espaces[sel]?.plateforme === "ipad" ? `<p class="avertissement large">Cet espace est sur iPad : une application installée ne pourra pas être ouverte depuis la borne. Publication bloquée tant que ce n'est pas réglé.</p>` : `<p class="aide large">Pour une application installée, prévoyez avec son porteur un mode démonstration sans connexion personnelle, ou une déconnexion automatique : la borne ne peut pas remettre l'application à zéro entre deux visiteurs.</p>`}
          <label>Paquet Android<input data-ks="android" value="${esc(s.android)}" placeholder="com.exemple.app"><small>Visible dans le lien Play Store : id=…</small></label>
          <label>Lien d'ouverture iOS<input data-ks="ios" value="${esc(s.ios)}" placeholder="exemple://"><small>Fourni par le porteur de l'application.</small></label>
          <label class="large">Page de l'application (pour le QR code)<input type="url" data-ks="url" value="${esc(s.url)}" placeholder="https://"></label>`}
        </div>
      </div>
    </div>`;
  }

  const edition = $("#edition");
  edition.addEventListener("input", (ev) => {
    const t = ev.target, e = brouillon.espaces[sel];
    if (t.dataset.k) {
      e[t.dataset.k] = t.type === "checkbox" ? t.checked : t.value;
      if (t.dataset.k === "nom") $("#edition h1").textContent = t.value || "Sans nom";
    } else if (t.dataset.kl === "activites") {
      e.activites = t.value.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 6);
    } else if (t.dataset.kl === "reperes") {
      e.reperes = t.value.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 3).map((x) => {
        const m = x.match(/^(.*?)\s*\|\s*(https:\/\/\S+)\s*$/); return m ? { texte: m[1], source: m[2] } : { texte: x, source: "" };
      });
    } else if (t.dataset.ks) {
      const j = +t.closest("[data-s]").dataset.s;
      e.solutions[j][t.dataset.ks] = t.value;
      if (t.dataset.ks === "nom") t.closest(".solution").querySelector(".solution-tete b").textContent = t.value || "Nouvelle solution";
      if (t.dataset.ks === "url") { const v = t.closest(".solution").querySelector("[data-verif]"); if (v) { v.textContent = ""; v.className = "verif"; } }
      t.classList.remove("invalide");
    }
    modifie();
  });
  edition.addEventListener("change", async (ev) => {
    const pourStand = ev.target.matches("[data-fichier-stand]");
    if (!ev.target.matches("[data-fichier]") && !pourStand) return;
    const f = ev.target.files[0]; if (!f) return;
    if (MAQUETTE) return toast("Maquette : l'envoi d'images est désactivé.");
    const j = pourStand ? -1 : +ev.target.closest("[data-s]").dataset.s;
    if (f.size > 2e6) return toast("Image trop lourde : 2 Mo maximum.");
    try {
      toast("Envoi de l'image…");
      const r = await fetch("/api/admin/logo", { method: "POST", body: f, headers: { "Content-Type": f.type } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erreur);
      if (pourStand) brouillon.espaces[sel][ev.target.dataset.fichierStand === "image" ? "image" : "logo"] = d.url; else brouillon.espaces[sel].solutions[j].logo = d.url;
      modifie(); rendreEdition(); toast("Image ajoutée.");
    } catch (e) { toast("Image non envoyée : " + e.message); }
  });
  edition.addEventListener("click", async (ev) => {
    const e = brouillon.espaces[sel];
    const sEl = ev.target.closest("[data-s]"); const j = sEl ? +sEl.dataset.s : -1;
    const ts = ev.target.closest("[data-typestand]");
    if (ts) { e.type = ts.dataset.typestand; modifie(); return rendreEdition(); }
    const pf = ev.target.closest("[data-plateforme]");
    if (pf) { e.plateforme = pf.dataset.plateforme; modifie(); return rendreEdition(); }
    const typ = ev.target.closest("[data-type]");
    if (typ) { e.solutions[j].type = typ.dataset.type; modifie(); return rendreEdition(); }
    const pic = ev.target.closest("[data-picto]");
    if (pic) { e.solutions[j].icone = pic.dataset.picto; modifie(); return rendreEdition(); }
    const a = ev.target.closest("[data-action]")?.dataset.action; if (!a) return;
    const S = e.solutions;
    const echanger = (arr, x, y) => { [arr[x], arr[y]] = [arr[y], arr[x]]; };
    switch (a) {
      case "monter": echanger(brouillon.espaces, sel, sel - 1); sel--; break;
      case "descendre": echanger(brouillon.espaces, sel, sel + 1); sel++; break;
      case "supprimer":
        if (!confirm(`Supprimer l'espace « ${e.nom} » ? Les tablettes affectées afficheront l'écran d'installation après publication.`)) return;
        brouillon.espaces.splice(sel, 1); sel = Math.max(0, sel - 1); break;
      case "installer": return installer(e);
      case "ajout-solution": S.push({ id: "s" + Math.random().toString(36).slice(2, 7), nom: "", porteur: "", description: "", type: "web", url: "https://", icone: "globe", logo: "" }); break;
      case "sol-monter": echanger(S, j, j - 1); break;
      case "sol-descendre": echanger(S, j, j + 1); break;
      case "sol-supprimer": S.splice(j, 1); break;
      case "voir-demandes": return $('.onglets [data-onglet="demandes"]').click();
      case "acces-creer": {
        const email = $("#acces-email").value.trim();
        if (!email) return toast("Indiquez l'e-mail de l'exposant.");
        try { montrerAcces(e, await api("/api/admin/exposants", { method: "POST", body: JSON.stringify({ action: "creer", email, espace: e.id }) })); chargerExposants(); }
        catch (err) { toast(err.message); }
        return;
      }
      case "acces-reinit": {
        const email = ev.target.closest("[data-email]").dataset.email;
        if (!confirm(`Générer un nouveau mot de passe provisoire pour ${email} ? L'ancien ne fonctionnera plus.`)) return;
        try { montrerAcces(e, await api("/api/admin/exposants", { method: "POST", body: JSON.stringify({ action: "reinitialiser", email }) })); chargerExposants(); }
        catch (err) { toast(err.message); }
        return;
      }
      case "acces-suppr": {
        const email = ev.target.closest("[data-email]").dataset.email;
        if (!confirm(`Retirer l'accès de ${email} ?`)) return;
        await api("/api/admin/exposants?email=" + encodeURIComponent(email), { method: "DELETE" }).catch((err) => toast(err.message));
        return chargerExposants();
      }
      case "logo-stand": return $('#edition [data-fichier-stand="logo"]').click();
      case "logo-stand-retirer": e.logo = ""; break;
      case "image-stand": return $('#edition [data-fichier-stand="image"]').click();
      case "image-stand-retirer": e.image = ""; break;
      case "logo": return sEl.querySelector("[data-fichier]").click();
      case "logo-retirer": S[j].logo = ""; break;
      case "pictos": return sEl.querySelector(".pictos").classList.toggle("ouvert");
      case "verifier": return verifier(j, sEl);
      case "tester": return window.open(S[j].url, "_blank", "noopener");
      default: return;
    }
    modifie(); rendreEdition();
  });
  document.addEventListener("click", (ev) => { if (!ev.target.closest(".visuel")) $$(".pictos.ouvert").forEach((p) => p.classList.remove("ouvert")); });

  async function verifier(j, sEl) {
    const s = brouillon.espaces[sel].solutions[j];
    const v = sEl.querySelector("[data-verif]");
    v.className = "verif attente"; v.textContent = "Vérification…";
    try {
      const r = await api("/api/admin/verifier?url=" + encodeURIComponent(s.url));
      if (r.accessible) { v.className = "verif ok"; v.textContent = r.adresseFinale && r.adresseFinale !== s.url ? `Le site répond (redirigé vers ${r.adresseFinale}).` : "Le site répond."; }
      else { v.className = "verif ko"; v.textContent = r.statut ? `Le site répond avec le code ${r.statut} : vérifiez l'adresse.` : r.raison; }
      modifie();
    } catch (e) { v.className = "verif ko"; v.textContent = e.message; }
  }

  /* ---------- Aperçu ---------- */
  let ecranApercu = "";
  function apercu() {
    try { localStorage.setItem(CLE, JSON.stringify(brouillon)); } catch {}
    const e = brouillon.espaces[sel];
    const f = $("#apercu");
    const src = e ? `/kiosk.html?apercu=1&espace=${encodeURIComponent(e.id)}${ecranApercu ? "&veille=1" : ""}${MAQUETTE ? "&cle=maquette&maquette=1&simule=2026-11-18T11:20" : ""}` : "about:blank";
    if (f.dataset.src !== src) { f.dataset.src = src; f.src = src; }
  }
  $$(".apercu .segment button").forEach((b) => b.addEventListener("click", () => {
    $$(".apercu .segment button").forEach((x) => x.setAttribute("aria-checked", x === b));
    ecranApercu = b.dataset.ecran; apercu();
  }));
  new ResizeObserver((es) => es.forEach((x) => { $("#apercu").style.transform = `scale(${x.contentRect.width / 820})`; })).observe($(".ecran-t"));

  /* ---------- Installation sur tablette ---------- */
  function installer(e) {
    const url = `${location.origin}/kiosk.html?espace=${encodeURIComponent(e.id)}`;
    const g = qrcode(0, "M"); g.addData(url); g.make();
    $("#qr-installer").innerHTML = g.createSvgTag({ cellSize: 5, margin: 2, scalable: true });
    $("#url-installer").textContent = url;
    $("#dlg-installer h2").textContent = `Installer « ${e.nom} » sur une tablette`;
    $("#dlg-installer").showModal();
  }
  $("#btn-copier").addEventListener("click", () => navigator.clipboard.writeText($("#url-installer").textContent).then(() => toast("Adresse copiée.")));

  /* ---------- Réglages de l'événement ---------- */
  function rendreReglages() {
    const f = $("#form-evenement"), ev = brouillon.evenement || {}, m = brouillon.minuteries || {};
    ["nom", "edition", "accroche", "dates", "horaires", "lieu"].forEach((k) => (f.elements[k].value = ev[k] || ""));
    f.elements.retourAccueilSecondes.value = m.retourAccueilSecondes || 60;
    f.elements.veilleSecondes.value = m.veilleSecondes || 45;
  }
  $("#form-evenement").addEventListener("input", (e) => {
    const t = e.target;
    if (t.name in { retourAccueilSecondes: 1, veilleSecondes: 1 }) { brouillon.minuteries = brouillon.minuteries || {}; brouillon.minuteries[t.name] = Number(t.value); }
    else { brouillon.evenement = brouillon.evenement || {}; brouillon.evenement[t.name] = t.value; }
    modifie({ liste: false });
  });

  /* ---------- Publication ---------- */
  $("#btn-publier").addEventListener("click", async () => {
    const b = $("#btn-publier");
    b.disabled = true; b.textContent = "Publication…";
    try {
      publie = await api("/api/admin/config", { method: "PUT", body: JSON.stringify(brouillon) });
      brouillon = { ...copie(publie), _base: publie.version };
      modifie(); rendreTout();
      toast("Publié. Les bornes affichent le nouveau contenu d'ici une minute.");
    } catch (e) {
      const errs = e.donnees?.erreurs;
      if (errs?.length) { $("#liste-erreurs").innerHTML = errs.map((x) => `<li>${esc(x)}</li>`).join(""); $("#dlg-erreurs").showModal(); }
      else toast(e.message);
    } finally { b.textContent = "Publier sur les bornes"; etatPublication(); }
  });

  /* ---------- Historique ---------- */
  $("#btn-historique").addEventListener("click", async () => {
    $("#versions").innerHTML = "<li>Chargement…</li>";
    $("#dlg-historique").showModal();
    try {
      const vs = await api("/api/admin/historique");
      $("#versions").innerHTML = vs.length ? vs.map((v, i) => `<li><div>${fmtHeure.format(new Date(v.version))}${i === 0 ? " <span>· en ligne</span>" : ""}</div>${i ? `<button class="btn" data-v="${v.version}">Restaurer</button>` : ""}</li>`).join("") : "<li><span>Aucune publication pour l'instant.</span></li>";
    } catch (e) { $("#versions").innerHTML = `<li>${esc(e.message)}</li>`; }
  });
  $("#versions").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-v]"); if (!b) return;
    if (!confirm("Republier cette version sur toutes les bornes ? Les modifications non publiées seront perdues.")) return;
    publie = await api("/api/admin/historique", { method: "POST", body: JSON.stringify({ version: b.dataset.v }) });
    brouillon = { ...copie(publie), _base: publie.version };
    sel = 0; modifie(); rendreTout(); $("#dlg-historique").close(); toast("Version restaurée et publiée.");
  });

  /* ---------- Suivi en direct ---------- */
  // Une tablette partie sur une solution ne bat plus : elle reste « avec un visiteur » 15 min avant d'être signalée
  const enLigne = (t) => Date.now() - new Date(t.vuLe).getTime() < (t.ecran === "solution" ? 900_000 : 150_000);
  async function chargerSuivi() {
    try {
      const d = await api("/api/admin/tablettes");
      vues = d.vues || [];
      tablettes = d.tablettes.sort((a, b) => (a.espace || "").localeCompare(b.espace || "") || (a.nom || "").localeCompare(b.nom || ""));
      const hors = tablettes.filter((t) => !enLigne(t)).length;
      $("#n-hors").textContent = hors || "";
      $("#n-hors").title = hors ? `${hors} tablette(s) hors ligne` : "";
      rendreSuivi();
      $("#suivi-maj").textContent = `Mis à jour à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}, actualisation toutes les 30 secondes.`;
    } catch {}
  }
  function jours() {
    const s = new Set([jour()]);
    tablettes.forEach((t) => Object.keys(t.touches || {}).concat(Object.keys(t.sessions || {})).forEach((d) => s.add(d)));
    vues.forEach((v) => s.add(v.jour));
    return [...s].sort().reverse();
  }
  $("#suivi-jour").addEventListener("change", rendreSuivi);
  function nomStand(id) { return brouillon.espaces.find((e) => e.id === id)?.nom || publie.espaces?.find((e) => e.id === id)?.nom || id || "Non affectée"; }
  function nomSolution(id) {
    for (const c of [brouillon, publie]) for (const e of c.espaces || []) for (const s of e.solutions || []) if (s.id === id) return { nom: s.nom, stand: e.nom };
    return { nom: id, stand: "" };
  }
  function rendreSuivi() {
    const sj = $("#suivi-jour"), choix = sj.value || jour();
    const js = jours();
    sj.innerHTML = [`<option value="tout">Les ${js.length} jours</option>`].concat(js.map((d) => `<option value="${d}">${d === jour() ? "Aujourd'hui" : fmtJour.format(new Date(d + "T12:00:00Z"))}</option>`)).join("");
    sj.value = js.includes(choix) || choix === "tout" ? choix : jour();
    const filtre = (o) => Object.entries(o || {}).filter(([d]) => sj.value === "tout" || d === sj.value);
    let visiteurs = 0, ouvertures = 0; const parSol = {};
    const lignes = tablettes.map((t) => {
      const v = filtre(t.sessions).reduce((a, [, n]) => a + n, 0);
      let o = 0;
      filtre(t.touches).forEach(([, m]) => Object.entries(m).forEach(([s, n]) => { o += n; parSol[s] = (parSol[s] || 0) + n; }));
      visiteurs += v; ouvertures += o;
      const ok = enLigne(t);
      const faible = t.batterie != null && t.batterie < 20 && !t.enCharge;
      const depuis = Math.round((Date.now() - new Date(t.vuLe)) / 60000);
      return `<tr>
        <td><b>${esc(t.nom || "Sans nom")}</b><small>${esc(t.navigateur || "")}</small></td>
        <td>${esc(nomStand(t.espace))}</td>
        <td><span class="etat ${ok ? "" : "hors"}"><i></i>${ok ? (t.ecran === "veille" ? "En veille" : t.ecran === "accueil" ? "Accueil" : t.ecran === "solution" ? `Sur ${esc(nomSolution(t.solution).nom || "une solution")}` : "Visiteur en cours") : `Hors ligne depuis ${depuis < 60 ? depuis + " min" : Math.round(depuis / 60) + " h"}`}</span>
          ${t.version && publie.version && t.version !== publie.version && ok ? '<small>Mise à jour en attente</small>' : ""}</td>
        <td class="batt ${faible ? "faible" : ""}">${t.batterie == null ? "—" : t.batterie + " %"}${t.enCharge ? " · en charge" : ""}</td>
        <td class="num">${v}</td><td class="num">${o}</td>
        <td><button class="btn icone discret" data-oublier="${esc(t.id)}" title="Retirer de la liste">${I.suppr}</button></td>
      </tr>`;
    });
    $("#tab-tablettes tbody").innerHTML = lignes.join("");
    $("#vide-tablettes").hidden = tablettes.length > 0;
    const vuesJour = vues.filter((v) => sj.value === "tout" || v.jour === sj.value);
    const enL = tablettes.filter(enLigne).length;
    const faibles = tablettes.filter((t) => enLigne(t) && t.batterie != null && t.batterie < 20 && !t.enCharge).length;
    $("#chiffres").innerHTML = `
      <div class="chiffre"><b>${visiteurs.toLocaleString("fr-FR")}</b><span>Visiteurs accueillis par les bornes</span></div>
      <div class="chiffre"><b>${ouvertures.toLocaleString("fr-FR")}</b><span>Solutions ouvertes</span></div>
      <div class="chiffre ${enL < tablettes.length ? "alerte" : ""}"><b>${enL}<small style="font-size:.5em"> / ${tablettes.length}</small></b><span>Tablettes en ligne</span></div>
      <div class="chiffre ${faibles ? "alerte" : ""}"><b>${faibles}</b><span>Batteries à recharger</span></div>
      <div class="chiffre"><b>${vuesJour.reduce((a, v) => a + v.n, 0).toLocaleString("fr-FR")}</b><span>Fiches consultées sur téléphone</span></div>`;
    const parEx = {}; vuesJour.forEach((v) => (parEx[v.exposant] = (parEx[v.exposant] || 0) + v.n));
    const topApp = Object.entries(parEx).sort((a, b) => b[1] - a[1]).slice(0, 12), maxA = topApp[0]?.[1] || 1;
    $("#classement-app").innerHTML = topApp.length ? topApp.map(([id, n]) => { const e = brouillon.espaces.find((x) => x.id === id); return `<li><div class="l"><b>${esc(e?.nom || id)}</b><b>${n}</b></div><div class="l"><span>${e?.numero ? "Stand " + esc(e.numero) : ""}</span></div><div class="barre"><i style="width:${(n / maxA) * 100}%"></i></div></li>`; }).join("")
      : '<li class="vide">Les consultations apparaîtront dès que des visiteurs scanneront les QR codes.</li>';
    const top = Object.entries(parSol).sort((a, b) => b[1] - a[1]).slice(0, 12);
    const max = top[0]?.[1] || 1;
    $("#classement").innerHTML = top.length ? top.map(([id, n]) => { const s = nomSolution(id); return `<li><div class="l"><b>${esc(s.nom)}</b><b>${n}</b></div><div class="l"><span>${esc(s.stand)}</span></div><div class="barre"><i style="width:${(n / max) * 100}%"></i></div></li>`; }).join("")
      : '<li class="vide">Les ouvertures apparaîtront ici dès les premiers visiteurs.</li>';
  }
  $("#tab-tablettes").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-oublier]"); if (!b) return;
    if (!confirm("Retirer cette tablette du suivi ? Elle réapparaîtra si elle se reconnecte.")) return;
    await api("/api/admin/tablettes?id=" + encodeURIComponent(b.dataset.oublier), { method: "DELETE" });
    chargerSuivi();
  });
  $("#btn-export").addEventListener("click", () => {
    const l = [["date", "tablette", "stand", "solution", "ouvertures"]];
    tablettes.forEach((t) => Object.entries(t.touches || {}).forEach(([d, m]) => Object.entries(m).forEach(([s, n]) => l.push([d, t.nom || t.id, nomStand(t.espace), nomSolution(s).nom, n]))));
    l.push([]); l.push(["date", "tablette", "stand", "visiteurs"]);
    tablettes.forEach((t) => Object.entries(t.sessions || {}).forEach(([d, n]) => l.push([d, t.nom || t.id, nomStand(t.espace), n])));
    const csv = "﻿" + l.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })), download: `village-bornes-${jour()}.csv` });
    a.click();
  });
  /* ---------- Maquette : données d'exemple, aucune écriture ---------- */
  let M = null;
  async function apiMaquette(url, opts = {}) {
    const m = (opts.method || "GET").toUpperCase();
    const b = opts.body ? JSON.parse(opts.body) : {};
    if (!M) {
      const cfg = await fetch("/api/config", { cache: "no-store" }).then((r) => { if (!r.ok) throw 0; return r.json(); }).catch(() => fetch("/config/espaces.json").then((r) => r.json()));
      cfg.publieLe = "2026-11-18T09:12:00+01:00";
      let g = 7; const al = (n) => { g = (g * 9301 + 49297) % 233280; return Math.floor((g / 233280) * n); };
      const J = "2026-11-18", now = Date.now();
      const tabs = cfg.espaces.map((e, i) => {
        const sols = e.solutions || [];
        const sessions = { [J]: e.type === "accueil" ? 412 : 30 + al(120) };
        const touches = { [J]: Object.fromEntries(sols.map((x) => [x.id, 8 + al(70)])) };
        const ipad = i % 4 === 3;
        return { id: "t" + i, nom: e.type === "accueil" ? "Accueil — entrée" : `Stand ${e.numero}`, espace: e.id,
          ecran: ["accueil", "veille", "solution", "accueil", "veille"][i % 5], solution: sols[0]?.id,
          batterie: i === 5 ? 14 : 38 + al(60), enCharge: i % 3 === 0, version: cfg.version,
          navigateur: ipad ? "iPad 10e génération · iPadOS 17 · Accès guidé" : "Galaxy Tab A8 · Android 13 · Fully Kiosk",
          vuLe: new Date(now - (i === 9 ? 42 * 60_000 : 15_000 + al(40_000))).toISOString(), sessions, touches };
      });
      const vues = cfg.espaces.filter((e) => e.type !== "accueil").map((e) => ({ jour: J, exposant: e.id, n: 12 + al(140) }));
      const fe = (id) => cfg.espaces.find((e) => e.id === id) || {};
      const demandes = [];
      const fd = fe("fedapay");
      if (fd.id) demandes.push({ id: 101, espace: "fedapay", email: "marketing@fedapay.com", statut: "en_attente", soumisLe: "2026-11-18T10:47:00+01:00",
        doc: { accroche: "Encaisser par mobile money et carte en deux minutes, partout en Afrique.", activites: [...(fd.activites || []), "Boutiques en ligne clés en main avec Yaburu.shop"] } });
      const gz = fe("gozem");
      if (gz.id) demandes.push({ id: 102, espace: "gozem", email: "partenariats@gozem.co", statut: "en_attente", soumisLe: "2026-11-18T11:05:00+01:00",
        doc: { telephone: "+229 01 00 00 00 00", presentation: (gz.presentation || "") + " Au Village, essayez une course en direct depuis la tablette." } });
      demandes.push({ id: 99, espace: "kkiapay", email: "contact@kkiapay.me", statut: "acceptee", soumisLe: "2026-11-17T16:20:00+01:00", traiteLe: "2026-11-17T17:02:00+01:00", doc: {} });
      demandes.push({ id: 98, espace: "ylomi", email: "hello@ylomi.bj", statut: "refusee", soumisLe: "2026-11-17T12:10:00+01:00", traiteLe: "2026-11-17T14:30:00+01:00", motif: "Logo trop petit, merci d'envoyer une version plus grande", doc: {} });
      const comptes = cfg.espaces.filter((e) => e.type !== "accueil").slice(0, 12).map((e, i) => ({ email: `stand${e.numero}@exposant.bj`, espace: e.id, provisoire: i % 5 === 4, vuLe: i % 5 === 4 ? null : "2026-11-18T08:3" + (i % 10) + ":00+01:00" }));
      M = { cfg, tabs, vues, demandes, comptes };
    }
    const chemin = url.split("?")[0];
    const attendre = (v) => new Promise((r) => setTimeout(() => r(v), 250));
    if (chemin === "/api/admin/config") {
      if (m === "PUT") { M.cfg = { ...b, version: Date.now(), publieLe: new Date().toISOString() }; toast("Maquette : rien n'est publié sur de vraies tablettes."); return attendre(copie(M.cfg)); }
      return copie(M.cfg);
    }
    if (chemin === "/api/admin/tablettes") return m === "DELETE" ? { ok: true } : { tablettes: copie(M.tabs).map((t) => ({ ...t, vuLe: t.id === "t9" ? t.vuLe : new Date(Date.now() - 20_000).toISOString() })), vues: copie(M.vues) };
    if (chemin === "/api/admin/historique") return m === "POST" ? copie(M.cfg) : [{ version: Date.parse(M.cfg.publieLe), auteur: "admin" }, { version: Date.parse("2026-11-17T18:40:00+01:00"), auteur: "admin" }];
    if (chemin === "/api/admin/verifier") return attendre({ accessible: true, statut: 200 });
    if (chemin === "/api/admin/session") return { ok: true };
    if (chemin === "/api/admin/exposants") {
      if (m === "GET") return { comptes: copie(M.comptes), demandes: copie(M.demandes) };
      if (m === "DELETE") { const em = new URLSearchParams(url.split("?")[1]).get("email"); M.comptes = M.comptes.filter((c) => c.email !== em); return { ok: true }; }
      if (b.action === "creer" || b.action === "reinitialiser") {
        const c = M.comptes.find((x) => x.email === b.email) || { email: b.email.toLowerCase(), espace: b.espace }; c.provisoire = true;
        if (!M.comptes.includes(c)) M.comptes.push(c);
        return attendre({ email: c.email, motDePasse: "demo-7k2p-x9qa" });
      }
      const d = M.demandes.find((x) => x.id === b.id);
      d.traiteLe = new Date().toISOString();
      if (b.action === "refuser") { d.statut = "refusee"; d.motif = b.motif || null; return { ok: true }; }
      d.statut = "acceptee";
      M.cfg = copie(M.cfg); const e = M.cfg.espaces.find((x) => x.id === d.espace); Object.assign(e, d.doc);
      M.cfg.version = Date.now(); M.cfg.publieLe = new Date().toISOString();
      return attendre(copie(M.cfg));
    }
    return {};
  }
  if (MAQUETTE) {
    document.documentElement.classList.add("maquette");
    $("#etat-pub").insertAdjacentHTML("beforebegin", '<span class="badge-maquette">Maquette</span>');
  }
})();

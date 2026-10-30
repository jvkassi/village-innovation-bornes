/* Espace exposant — chaque stand propose ses contenus, l'équipe du MTDI valide et publie.
 * ?maquette=1&stand=<id>   démonstration sans connexion : rien n'est envoyé */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const q = new URLSearchParams(location.search);
  const MAQUETTE = q.has("maquette");
  const CLE = "village.brouillon.exposant";
  const fmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Porto-Novo" });
  const CHAMPS = ["nomComplet", "accroche", "presentation", "activites", "reperes", "site", "email", "telephone", "logo", "image", "solutions"];
  const ICONES = { globe: "Site web", wallet: "Paiement", doc: "Démarche", id: "Identité", passport: "Voyage", building: "Entreprise", receipt: "Facture", pulse: "Santé", leaf: "Environnement", sun: "Énergie", route: "Mobilité", school: "Formation", chip: "Technologie", chat: "Échange", phone: "Mobile", plan: "Carte" };

  let cfg = null, publie = null, fiche = null, demande = null;

  async function api(url, opts = {}) {
    const r = await fetch(url, { credentials: "same-origin", ...opts, headers: { "Content-Type": "application/json", ...(opts.headers || {}) } });
    const d = await r.json().catch(() => ({}));
    if (r.status === 401) { montrer("connexion"); throw new Error(d.erreur || "Session expirée"); }
    if (!r.ok) throw Object.assign(new Error(d.erreur || "Erreur " + r.status), { donnees: d });
    return d;
  }
  function toast(t) { const e = $("#toast"); e.textContent = t; e.classList.add("visible"); clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove("visible"), 4200); }
  function montrer(ecran) { ["connexion", "nouveau-mdp"].forEach((id) => ($("#" + id).hidden = id !== ecran)); $("#app").hidden = ecran !== "app"; }

  /* ---------- Connexion ---------- */
  $("#form-connexion").addEventListener("submit", async (e) => {
    e.preventDefault(); $("#err-connexion").textContent = "";
    try {
      const r = await api("/api/exposant?a=connexion", { method: "POST", body: JSON.stringify({ email: $("#c-email").value, motDePasse: $("#c-mdp").value }) });
      if (r.provisoire) { $("#m-actuel").value = $("#c-mdp").value; montrer("nouveau-mdp"); $("#m-nouveau").focus(); } else demarrer();
      $("#c-mdp").value = "";
    } catch (err) { $("#err-connexion").textContent = err.message; }
  });
  $("#form-mdp").addEventListener("submit", async (e) => {
    e.preventDefault(); $("#err-mdp").textContent = "";
    if ($("#m-nouveau").value !== $("#m-confirme").value) return ($("#err-mdp").textContent = "Les deux mots de passe ne correspondent pas.");
    try {
      await api("/api/exposant?a=motdepasse", { method: "POST", body: JSON.stringify({ actuel: $("#m-actuel").value, nouveau: $("#m-nouveau").value }) });
      ["#m-actuel", "#m-nouveau", "#m-confirme"].forEach((s) => ($(s).value = ""));
      toast("Mot de passe enregistré."); demarrer();
    } catch (err) { $("#err-mdp").textContent = err.message; }
  });
  $("#btn-sortir").addEventListener("click", async () => {
    if (MAQUETTE) return toast("Maquette : la déconnexion est désactivée.");
    await api("/api/exposant?a=session", { method: "DELETE" }).catch(() => {}); montrer("connexion");
  });

  async function initialiser() {
    if (MAQUETTE) return demarrer();
    const s = await fetch("/api/exposant?a=session").then((r) => r.json()).catch(() => ({}));
    if (!s.connecte) return montrer("connexion");
    if (s.provisoire) return montrer("nouveau-mdp");
    demarrer();
  }

  async function demarrer() {
    montrer("app");
    cfg = await fetch("/api/config", { cache: "no-store" }).then((r) => { if (!r.ok) throw 0; return r.json(); }).catch(() => fetch("/config/espaces.json").then((r) => r.json()));
    if (MAQUETTE) {
      const id = q.get("stand") || "fedapay";
      publie = cfg.espaces.find((e) => e.id === id) || cfg.espaces.find((e) => e.type !== "accueil");
      demande = { statut: "acceptee", traiteLe: "2026-11-12T15:40:00+01:00" };
      $("#qui").textContent = "contact@" + (publie.site ? new URL(publie.site).hostname.replace(/^www\./, "") : "exposant.bj");
    } else {
      try {
        const d = await api("/api/exposant?a=fiche");
        publie = d.espace; demande = d.demande;
        const s = await fetch("/api/exposant?a=session").then((r) => r.json());
        $("#qui").textContent = s.email || "";
      } catch (e) { $("#formulaire").innerHTML = `<p class="vide">${esc(e.message)}</p>`; return; }
    }
    // On repart de la demande en attente s'il y en a une, sinon du contenu publié
    fiche = JSON.parse(JSON.stringify({ ...publie, ...(demande?.statut === "en_attente" ? demande.doc : {}) }));
    fiche.solutions = fiche.solutions || []; fiche.activites = fiche.activites || []; fiche.reperes = fiche.reperes || [];
    $("#ex-stand").textContent = [publie.numero ? "Stand " + publie.numero : "", publie.thematique].filter(Boolean).join(" · ");
    $("#ex-nom").textContent = publie.nom;
    $("#voir-fiche").href = `/v/#/exposant/${encodeURIComponent(publie.id)}`;
    rendre(); statut(); apercu(); etat();
  }

  /* ---------- Statut de la demande ---------- */
  function statut() {
    const d = demande, el = $("#statut");
    if (!d) { el.className = "statut"; el.innerHTML = "<b>Votre fiche est en ligne.</b> Modifiez-la puis envoyez-la : l'équipe du Village la valide avant publication sur les tablettes."; return; }
    if (d.statut === "en_attente") { el.className = "statut attente"; el.innerHTML = `<b>En attente de validation</b> depuis le ${fmt.format(new Date(d.soumisLe))}. Vous pouvez encore la modifier et la renvoyer.`; return; }
    if (d.statut === "acceptee") { el.className = "statut ok"; el.innerHTML = `<b>Votre dernière demande a été validée</b>${d.traiteLe ? " le " + fmt.format(new Date(d.traiteLe)) : ""} et publiée sur les tablettes.`; return; }
    el.className = "statut refus"; el.innerHTML = `<b>Votre dernière demande n'a pas été retenue.</b> ${d.motif ? "Motif : " + esc(d.motif) : "Contactez l'équipe du Village pour en savoir plus."}`;
  }

  /* ---------- Formulaire ---------- */
  function rendre() {
    const f = fiche, n = f.solutions.length;
    $("#formulaire").innerHTML = `
      <div class="bloc"><h3>Présentation</h3><div class="champs">
        <label class="large">Nom complet <small>affiché sur la fiche téléphone</small><input data-k="nomComplet" value="${esc(f.nomComplet)}" maxlength="140"></label>
        <label class="large">Accroche <small>une phrase, affichée en grand sur la tablette</small><input data-k="accroche" value="${esc(f.accroche)}" maxlength="90"></label>
        <label class="large">Présentation <small>3 phrases au plus</small><textarea data-k="presentation" maxlength="700" rows="4">${esc(f.presentation)}</textarea></label>
        <label class="large">Ce que vous faites <small>une activité par ligne, 6 au plus ; les premières s'affichent sur la tablette</small><textarea data-kl="activites" rows="5">${esc(f.activites.join("\n"))}</textarea></label>
        <label class="large">Repères <small>un par ligne : texte | https://source (une date, un chiffre, une distinction)</small><textarea data-kl="reperes" rows="2">${esc(f.reperes.map((r) => r.texte + (r.source ? " | " + r.source : "")).join("\n"))}</textarea></label>
      </div></div>
      <div class="bloc"><h3>Visuels</h3><div class="champs">
        ${visuel("logo", "Logo", "PNG ou SVG, fond transparent de préférence")}
        ${visuel("image", "Image ou capture", "Affichée sur la fiche téléphone")}
      </div></div>
      <div class="bloc"><h3>Contacts</h3><div class="champs">
        <label>Site web<input type="url" data-k="site" value="${esc(f.site)}" placeholder="https://"></label>
        <label>E-mail<input type="email" data-k="email" value="${esc(f.email)}" placeholder="contact@exemple.bj"></label>
        <label>Téléphone<input data-k="telephone" value="${esc(f.telephone)}" placeholder="+229 …"></label>
      </div></div>
      <h2 class="sous-titre">À essayer sur la tablette <small>${n} sur 4</small></h2>
      ${f.solutions.map(blocSolution).join("")}
      ${n < 4 ? '<button class="ajout-solution" data-action="ajout">Ajouter une solution à essayer</button>' : ""}
      <p class="note-bas">Le numéro de stand, la thématique et le modèle de tablette sont gérés par l'équipe du Village.</p>`;
  }
  function visuel(k, titre, aide) {
    const v = fiche[k];
    return `<div class="visuel-ex"><span class="etiquette">${titre}</span>
      <div class="vignette-ex ${v ? "pleine" : ""}">${v ? `<img src="${esc(v)}" alt="">` : "Aucun"}</div>
      <span class="url-ligne"><button class="btn" data-envoi="${k}">${v ? "Changer" : "Envoyer"}</button>${v ? `<button class="btn discret" data-retirer="${k}">Retirer</button>` : ""}</span>
      <small class="aide">${aide}. 2 Mo maximum.</small>
      <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden data-fichier="${k}"></div>`;
  }
  function blocSolution(s, j) {
    const web = s.type !== "app";
    return `<div class="solution" data-s="${j}">
      <div class="solution-tete"><span class="ordre">${j + 1}</span><b>${esc(s.nom || "Nouvelle solution")}</b>
        <button class="btn icone danger" data-action="retirer" title="Retirer la solution">✕</button></div>
      <div class="champs" style="padding:14px">
        <label>Nom du bouton<input data-ks="nom" value="${esc(s.nom)}" maxlength="60"></label>
        <label>Pictogramme<select data-ks="icone">${Object.entries(ICONES).map(([k, l]) => `<option value="${k}" ${s.icone === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
        <label class="large">Description courte<input data-ks="description" value="${esc(s.description)}" maxlength="160" placeholder="Ce que le visiteur peut faire, en une phrase."></label>
        <div class="large"><div class="segment" role="radiogroup" aria-label="Type">
          <button role="radio" aria-checked="${web}" data-type="web">Site ou application web</button>
          <button role="radio" aria-checked="${!web}" data-type="app">Application à installer</button></div></div>
        ${web ? `<label class="large">Adresse<input type="url" data-ks="url" value="${esc(s.url)}" placeholder="https://"></label>`
          : `<p class="aide large">Une application installée s'ouvre uniquement sur tablette Android. Prévoyez un mode démonstration sans connexion personnelle : la tablette ne peut pas remettre l'application à zéro entre deux visiteurs.</p>
          <label>Paquet Android<input data-ks="android" value="${esc(s.android)}" placeholder="com.exemple.app"></label>
          <label>Page de l'application<input type="url" data-ks="url" value="${esc(s.url)}" placeholder="https://play.google.com/…"></label>`}
      </div></div>`;
  }

  const F = $("#formulaire");
  F.addEventListener("input", (ev) => {
    const t = ev.target;
    if (t.dataset.k) fiche[t.dataset.k] = t.value;
    else if (t.dataset.kl === "activites") fiche.activites = t.value.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 6);
    else if (t.dataset.kl === "reperes") fiche.reperes = t.value.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 3).map((x) => {
      const m = x.match(/^(.*?)\s*\|\s*(https:\/\/\S+)\s*$/); return m ? { texte: m[1], source: m[2] } : { texte: x, source: "" };
    });
    else if (t.dataset.ks) {
      const s = fiche.solutions[+t.closest("[data-s]").dataset.s]; s[t.dataset.ks] = t.value;
      if (t.dataset.ks === "nom") t.closest(".solution").querySelector(".solution-tete b").textContent = t.value || "Nouvelle solution";
    }
    change();
  });
  F.addEventListener("change", (ev) => { if (ev.target.matches("select[data-ks]")) { fiche.solutions[+ev.target.closest("[data-s]").dataset.s].icone = ev.target.value; change(); } });
  F.addEventListener("click", (ev) => {
    const typ = ev.target.closest("[data-type]");
    if (typ) { fiche.solutions[+typ.closest("[data-s]").dataset.s].type = typ.dataset.type; change(); return rendre(); }
    const env = ev.target.closest("[data-envoi]");
    if (env) { if (MAQUETTE) return toast("Maquette : l'envoi d'images est désactivé."); return $(`[data-fichier="${env.dataset.envoi}"]`).click(); }
    const ret = ev.target.closest("[data-retirer]");
    if (ret) { fiche[ret.dataset.retirer] = ""; change(); return rendre(); }
    const a = ev.target.closest("[data-action]")?.dataset.action;
    if (a === "ajout") fiche.solutions.push({ id: "s" + Math.random().toString(36).slice(2, 7), nom: "", description: "", type: "web", url: "https://", icone: "globe" });
    if (a === "retirer") fiche.solutions.splice(+ev.target.closest("[data-s]").dataset.s, 1);
    if (a) { change(); rendre(); }
  });
  F.addEventListener("change", async (ev) => {
    const inp = ev.target.closest("[data-fichier]"); if (!inp) return;
    const f = inp.files[0]; if (!f) return;
    if (f.size > 2e6) return toast("Image trop lourde : 2 Mo maximum.");
    try {
      toast("Envoi de l'image…");
      const r = await fetch("/api/exposant?a=image", { method: "POST", body: f, headers: { "Content-Type": f.type } });
      const d = await r.json(); if (!r.ok) throw new Error(d.erreur);
      fiche[inp.dataset.fichier] = d.url; change(); rendre(); toast("Image ajoutée à votre fiche.");
    } catch (e) { toast("Image non envoyée : " + e.message); }
  });

  /* ---------- Aperçu et envoi ---------- */
  const net = (o) => JSON.stringify(CHAMPS.map((k) => o?.[k] ?? ""));
  function etat() {
    const base = demande?.statut === "en_attente" ? { ...publie, ...demande.doc } : publie;
    $("#btn-envoyer").disabled = net(fiche) === net(base);
  }
  let tA;
  function change() { etat(); clearTimeout(tA); tA = setTimeout(ecrireApercu, 200); }
  function ecrireApercu() {
    const c = { ...cfg, espaces: cfg.espaces.map((e) => (e.id === publie.id ? { ...e, ...fiche } : e)) };
    try { localStorage.setItem(CLE, JSON.stringify(c)); } catch {}
  }
  let ecran = "";
  function apercu() {
    ecrireApercu();
    const src = `/kiosk.html?apercu=1&cle=exposant&espace=${encodeURIComponent(publie.id)}${ecran ? "&veille=1" : ""}${MAQUETTE ? "&maquette=1&simule=2026-11-18T11:20" : ""}`;
    const f = $("#apercu"); if (f.dataset.src !== src) { f.dataset.src = src; f.src = src; }
  }
  $$(".apercu .segment button").forEach((b) => b.addEventListener("click", () => {
    $$(".apercu .segment button").forEach((x) => x.setAttribute("aria-checked", x === b)); ecran = b.dataset.ecran; apercu();
  }));
  new ResizeObserver((es) => es.forEach((x) => { $("#apercu").style.transform = `scale(${x.contentRect.width / 820})`; })).observe($(".ecran-t"));

  $("#btn-envoyer").addEventListener("click", async () => {
    const b = $("#btn-envoyer"); b.disabled = true;
    if (MAQUETTE) {
      demande = { statut: "en_attente", soumisLe: new Date().toISOString(), doc: JSON.parse(JSON.stringify(fiche)) };
      statut(); etat(); return toast("Maquette : rien n'est envoyé. En vrai, l'équipe du Village reçoit votre demande.");
    }
    try {
      const doc = {}; CHAMPS.forEach((k) => (doc[k] = fiche[k]));
      demande = await api("/api/exposant?a=fiche", { method: "PUT", body: JSON.stringify(doc) });
      statut(); etat(); toast("Envoyé. L'équipe du Village va valider vos modifications.");
    } catch (e) {
      const errs = e.donnees?.erreurs; toast(errs?.length ? errs.join(" ") : e.message); etat();
    }
  });

  initialiser();
})();

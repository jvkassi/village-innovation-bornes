# Bornes du Village de l'Innovation

Bornes tablettes, application visiteur et back-office du **Village de l'Innovation** (Benin Digital & Innovation Week, Cotonou, 18–20 novembre 2026). Réalisé par Synelia.

| Adresse | Rôle |
| --- | --- |
| `/kiosk.html` | Borne de stand (présentation de l'exposant, « Essayer », QR) ou tablette d'accueil (annuaire, programme) |
| `/v/` | Application visiteur sur téléphone : exposants, fiche, programme, plan, mes stands |
| `/admin` | Back-office : exposants, programme, publication, historique, suivi en direct des tablettes |
| `/` | Page de présentation des maquettes |

## Architecture

- Site statique (`public/`) et fonctions serverless (`api/`) sur Vercel.
- **Neon (Postgres)** : publications (historique complet), état des tablettes, consultations de l'application visiteur. Schéma : `scripts/schema.sql`.
- **Vercel Blob** : logos envoyés depuis le back-office.
- `public/config/espaces.json` : contenu de repli si la base est injoignable.

## Variables d'environnement

`DATABASE_URL` (Neon), `BLOB_READ_WRITE_TOKEN`, `ADMIN_PASSWORD`, `SESSION_SECRET`.

## Installer une tablette

1. Navigateur kiosque : Fully Kiosk Browser (Android) ou navigateur kiosque iOS.
2. Back-office > stand > « Installer sur une tablette » : ouvrir l'adresse (ou scanner le QR) sur la tablette.
3. Régler dans le navigateur kiosque : bouton Accueil, retour à la page de départ après 60 s d'inactivité, effacement des cookies au retour, liste des sites autorisés.

## Développement

```sh
npm install
vercel env pull .env.local
node scripts/migrer.mjs   # crée le schéma (idempotent)
vercel dev
```

## Déploiement

Chaque push sur `main` déploie en production sur Vercel (https://village-innovation-bornes.vercel.app).

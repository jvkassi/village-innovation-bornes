create table if not exists publications (
  version   bigint primary key,
  doc       jsonb not null,
  auteur    text,
  publie_le timestamptz not null default now()
);
create table if not exists tablettes (
  id     text primary key,
  espace text not null default '',
  data   jsonb not null,
  vu_le  timestamptz not null default now()
);
create table if not exists vues (
  jour     date not null,
  exposant text not null,
  n        integer not null default 0,
  primary key (jour, exposant)
);
;
create table if not exists comptes (email text primary key, espace text not null, empreinte text not null, provisoire boolean not null default true, cree_le timestamptz not null default now(), vu_le timestamptz);
create table if not exists demandes (id bigserial primary key, espace text not null, email text not null, doc jsonb not null, statut text not null default 'en_attente', soumis_le timestamptz not null default now(), traite_le timestamptz, motif text)

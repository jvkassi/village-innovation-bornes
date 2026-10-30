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

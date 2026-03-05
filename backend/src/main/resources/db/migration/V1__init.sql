create table tenants (
  id uuid primary key,
  name varchar(120) not null,
  created_at timestamptz not null default now(),
  constraint ck_tenants_name_not_blank check (btrim(name) <> '')
);

create table branches (
  id uuid primary key,
  tenant_id uuid not null,
  code varchar(32) not null,
  name varchar(120) not null,
  time_zone varchar(64) not null default 'America/Guayaquil',
  created_at timestamptz not null default now(),
  constraint fk_branches_tenant
    foreign key (tenant_id) references tenants (id),
  constraint uq_branches_tenant_code
    unique (tenant_id, code),
  constraint uq_branches_tenant_branch
    unique (tenant_id, id),
  constraint ck_branches_code_not_blank
    check (btrim(code) <> ''),
  constraint ck_branches_name_not_blank
    check (btrim(name) <> ''),
  constraint ck_branches_time_zone_not_blank
    check (btrim(time_zone) <> '')
);

create table users (
  id uuid primary key,
  tenant_id uuid not null,
  email varchar(320) not null,
  password_hash varchar(255) not null,
  created_at timestamptz not null default now(),
  constraint fk_users_tenant
    foreign key (tenant_id) references tenants (id),
  constraint uq_users_tenant_email
    unique (tenant_id, email),
  constraint ck_users_email_not_blank
    check (btrim(email) <> ''),
  constraint ck_users_password_hash_not_blank
    check (btrim(password_hash) <> '')
);

create table receipt_sequences (
  id uuid primary key,
  tenant_id uuid not null,
  branch_id uuid not null,
  year integer not null,
  next_seq integer not null,
  created_at timestamptz not null default now(),
  constraint fk_receipt_sequences_tenant
    foreign key (tenant_id) references tenants (id),
  constraint fk_receipt_sequences_branch
    foreign key (tenant_id, branch_id) references branches (tenant_id, id),
  constraint uq_receipt_sequences_tenant_branch_year
    unique (tenant_id, branch_id, year),
  constraint ck_receipt_sequences_year_positive
    check (year >= 2000),
  constraint ck_receipt_sequences_next_seq_positive
    check (next_seq >= 1)
);

create index ix_branches_tenant_id on branches (tenant_id);
create index ix_users_tenant_id on users (tenant_id);
create index ix_receipt_sequences_tenant_branch on receipt_sequences (tenant_id, branch_id);

create table clients (
  id uuid not null,
  tenant_id uuid not null,
  branch_id uuid not null,
  full_name text not null,
  phone text null,
  email text null,
  notes text null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pk_clients primary key (id),
  constraint fk_clients_branch
    foreign key (tenant_id, branch_id)
    references branches (tenant_id, id)
    on delete restrict,
  constraint ck_clients_full_name_min_length
    check (char_length(btrim(full_name)) >= 2)
);

create index idx_clients_tenant_branch_created_at
  on clients (tenant_id, branch_id, created_at desc);

create index idx_clients_tenant_branch_name_ci
  on clients (tenant_id, branch_id, lower(full_name));

create index idx_clients_tenant_branch_phone
  on clients (tenant_id, branch_id, phone)
  where phone is not null;

create index idx_clients_tenant_branch_email_ci
  on clients (tenant_id, branch_id, lower(email))
  where email is not null;

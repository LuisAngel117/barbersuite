alter table users
  add column if not exists active boolean not null default true;

alter table users
  add column if not exists phone text null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'users'
      and c.contype = 'u'
      and c.conname = 'uq_users_tenant_user'
  ) then
    alter table users
      add constraint uq_users_tenant_user unique (tenant_id, id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'services'
      and c.contype = 'u'
      and c.conname = 'uq_services_tenant_id_id'
  ) then
    alter table services
      add constraint uq_services_tenant_id_id unique (tenant_id, id);
  end if;
end
$$;

create table barber_services (
  id uuid not null,
  tenant_id uuid not null,
  barber_id uuid not null,
  service_id uuid not null,
  created_at timestamptz not null default now(),
  constraint pk_barber_services primary key (id),
  constraint fk_barber_services_barber
    foreign key (tenant_id, barber_id)
    references users (tenant_id, id)
    on delete cascade,
  constraint fk_barber_services_service
    foreign key (tenant_id, service_id)
    references services (tenant_id, id)
    on delete restrict,
  constraint uq_barber_services_tenant_barber_service
    unique (tenant_id, barber_id, service_id)
);

create index if not exists idx_users_tenant_active
  on users (tenant_id, active);

create index if not exists idx_user_roles_tenant_role
  on user_roles (tenant_id, role);

create index if not exists idx_uba_tenant_branch_user
  on user_branch_access (tenant_id, branch_id, user_id);

create index if not exists idx_barber_services_tenant_barber
  on barber_services (tenant_id, barber_id);

create index if not exists idx_barber_services_tenant_service
  on barber_services (tenant_id, service_id);

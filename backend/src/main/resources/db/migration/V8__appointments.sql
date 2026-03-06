create extension if not exists btree_gist;

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

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'clients'
      and c.contype = 'u'
      and c.conname = 'uq_clients_tenant_branch_id'
  ) then
    alter table clients
      add constraint uq_clients_tenant_branch_id unique (tenant_id, branch_id, id);
  end if;
end
$$;

create index if not exists idx_user_roles_tenant_role
  on user_roles (tenant_id, role);

create table appointments (
  id uuid not null,
  tenant_id uuid not null,
  branch_id uuid not null,
  client_id uuid not null,
  barber_id uuid not null,
  service_id uuid not null,
  status text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pk_appointments primary key (id),
  constraint fk_appointments_branch
    foreign key (tenant_id, branch_id)
    references branches (tenant_id, id),
  constraint fk_appointments_client
    foreign key (tenant_id, branch_id, client_id)
    references clients (tenant_id, branch_id, id),
  constraint fk_appointments_barber
    foreign key (tenant_id, barber_id)
    references users (tenant_id, id),
  constraint fk_appointments_service
    foreign key (tenant_id, service_id)
    references services (tenant_id, id),
  constraint ck_appointments_status_valid
    check (status in ('scheduled', 'checked_in', 'completed', 'cancelled', 'no_show')),
  constraint ck_appointments_end_after_start
    check (end_at > start_at),
  constraint ck_appointments_duration_seconds_range
    check (extract(epoch from (end_at - start_at)) between 300 and 28800),
  constraint ex_appt_no_overlap
    exclude using gist (
      tenant_id with =,
      branch_id with =,
      barber_id with =,
      tstzrange(start_at, end_at, '[)') with &&
    )
    where (status in ('scheduled', 'checked_in'))
);

create index idx_appt_tenant_branch_start
  on appointments (tenant_id, branch_id, start_at);

create index idx_appt_tenant_branch_barber_start
  on appointments (tenant_id, branch_id, barber_id, start_at);

create index idx_appt_tenant_branch_status_start
  on appointments (tenant_id, branch_id, status, start_at);

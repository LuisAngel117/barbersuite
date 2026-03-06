create table services (
  id uuid not null,
  tenant_id uuid not null,
  name text not null,
  duration_minutes integer not null,
  price numeric(12, 2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pk_services primary key (id),
  constraint fk_services_tenant
    foreign key (tenant_id) references tenants (id),
  constraint ck_services_name_not_blank
    check (btrim(name) <> ''),
  constraint ck_services_duration_minutes_range
    check (duration_minutes between 5 and 480),
  constraint ck_services_price_non_negative
    check (price >= 0)
);

create unique index ux_services_tenant_name_ci
  on services (tenant_id, lower(name));

create index idx_services_tenant_active
  on services (tenant_id, active);

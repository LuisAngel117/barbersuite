alter table users
  add constraint uq_users_tenant_user unique (tenant_id, id);

create table user_roles (
  tenant_id uuid not null,
  user_id uuid not null,
  role varchar(32) not null,
  created_at timestamptz not null default now(),
  constraint fk_user_roles_tenant
    foreign key (tenant_id) references tenants (id),
  constraint fk_user_roles_user
    foreign key (tenant_id, user_id) references users (tenant_id, id),
  constraint uq_user_roles_tenant_user_role
    unique (tenant_id, user_id, role),
  constraint ck_user_roles_role_valid
    check (role in ('ADMIN', 'MANAGER', 'BARBER', 'RECEPTION'))
);

create index ix_user_roles_tenant_user on user_roles (tenant_id, user_id);

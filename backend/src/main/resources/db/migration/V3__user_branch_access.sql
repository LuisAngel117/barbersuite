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
      and pg_get_constraintdef(c.oid) = 'UNIQUE (tenant_id, id)'
  ) then
    alter table users
      add constraint uq_users_tenant_id_id unique (tenant_id, id);
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
      and t.relname = 'branches'
      and c.contype = 'u'
      and pg_get_constraintdef(c.oid) = 'UNIQUE (tenant_id, id)'
  ) then
    alter table branches
      add constraint uq_branches_tenant_id_id unique (tenant_id, id);
  end if;
end
$$;

create table user_branch_access (
  id uuid not null,
  tenant_id uuid not null,
  user_id uuid not null,
  branch_id uuid not null,
  created_at timestamptz not null default now(),
  constraint pk_user_branch_access primary key (id),
  constraint uq_user_branch_access_tenant_user_branch
    unique (tenant_id, user_id, branch_id),
  constraint fk_user_branch_access_user
    foreign key (tenant_id, user_id)
    references users (tenant_id, id)
    on delete cascade,
  constraint fk_user_branch_access_branch
    foreign key (tenant_id, branch_id)
    references branches (tenant_id, id)
    on delete cascade
);

create index ix_user_branch_access_tenant_user
  on user_branch_access (tenant_id, user_id);

create index ix_user_branch_access_tenant_branch
  on user_branch_access (tenant_id, branch_id);

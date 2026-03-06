create table barber_weekly_availability (
  id uuid primary key,
  tenant_id uuid not null,
  branch_id uuid not null,
  barber_id uuid not null,
  day_of_week int not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_barber_weekly_availability_branch
    foreign key (tenant_id, branch_id)
    references branches (tenant_id, id)
    on delete cascade,
  constraint fk_barber_weekly_availability_barber
    foreign key (tenant_id, barber_id)
    references users (tenant_id, id)
    on delete cascade,
  constraint ck_barber_weekly_availability_day_of_week
    check (day_of_week between 1 and 7),
  constraint ck_barber_weekly_availability_time_range
    check (end_time > start_time)
);

create index idx_weekly_lookup
  on barber_weekly_availability (tenant_id, branch_id, barber_id, day_of_week);

create table barber_availability_exceptions (
  id uuid primary key,
  tenant_id uuid not null,
  branch_id uuid not null,
  barber_id uuid not null,
  date date not null,
  type text not null,
  note text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_barber_availability_exceptions_tenant_id
    unique (tenant_id, id),
  constraint uq_barber_availability_exceptions_tenant_branch_barber_date
    unique (tenant_id, branch_id, barber_id, date),
  constraint fk_barber_availability_exceptions_branch
    foreign key (tenant_id, branch_id)
    references branches (tenant_id, id)
    on delete cascade,
  constraint fk_barber_availability_exceptions_barber
    foreign key (tenant_id, barber_id)
    references users (tenant_id, id)
    on delete cascade,
  constraint ck_barber_availability_exceptions_type
    check (type in ('closed', 'override'))
);

create index idx_exceptions_lookup
  on barber_availability_exceptions (tenant_id, branch_id, barber_id, date);

create table barber_exception_intervals (
  id uuid primary key,
  tenant_id uuid not null,
  exception_id uuid not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  constraint fk_barber_exception_intervals_exception
    foreign key (tenant_id, exception_id)
    references barber_availability_exceptions (tenant_id, id)
    on delete cascade,
  constraint ck_barber_exception_intervals_time_range
    check (end_time > start_time)
);

create index idx_barber_exception_intervals_exception
  on barber_exception_intervals (tenant_id, exception_id);

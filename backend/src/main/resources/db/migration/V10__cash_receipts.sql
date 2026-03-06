do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'appointments'
      and c.contype = 'u'
      and c.conname = 'uq_appointments_tenant_branch_id'
  ) then
    alter table appointments
      add constraint uq_appointments_tenant_branch_id unique (tenant_id, branch_id, id);
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
      and t.relname = 'receipt_sequences'
      and c.contype = 'u'
      and c.conname = 'uq_receipt_sequences_tenant_branch_year'
  ) then
    alter table receipt_sequences
      add constraint uq_receipt_sequences_tenant_branch_year
      unique (tenant_id, branch_id, year);
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
      and t.relname = 'receipt_sequences'
      and c.contype = 'c'
      and c.conname = 'ck_receipt_sequences_next_seq_positive'
  ) then
    alter table receipt_sequences
      add constraint ck_receipt_sequences_next_seq_positive
      check (next_seq >= 1);
  end if;
end
$$;

create table receipts (
  id uuid not null,
  tenant_id uuid not null,
  branch_id uuid not null,
  number text not null,
  status text not null,
  client_id uuid null,
  appointment_id uuid null,
  issued_at timestamptz not null default now(),
  subtotal numeric(12, 2) not null,
  discount numeric(12, 2) not null default 0,
  tax numeric(12, 2) not null default 0,
  total numeric(12, 2) not null,
  notes text null,
  void_reason text null,
  voided_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pk_receipts primary key (id),
  constraint uq_receipts_tenant_id unique (tenant_id, id),
  constraint uq_receipts_tenant_branch_number unique (tenant_id, branch_id, number),
  constraint fk_receipts_branch
    foreign key (tenant_id, branch_id)
    references branches (tenant_id, id),
  constraint fk_receipts_client
    foreign key (tenant_id, branch_id, client_id)
    references clients (tenant_id, branch_id, id),
  constraint fk_receipts_appointment
    foreign key (tenant_id, branch_id, appointment_id)
    references appointments (tenant_id, branch_id, id),
  constraint ck_receipts_number_not_blank
    check (btrim(number) <> ''),
  constraint ck_receipts_status_valid
    check (status in ('issued', 'voided')),
  constraint ck_receipts_subtotal_non_negative
    check (subtotal >= 0),
  constraint ck_receipts_discount_non_negative
    check (discount >= 0),
  constraint ck_receipts_tax_non_negative
    check (tax >= 0),
  constraint ck_receipts_total_non_negative
    check (total >= 0),
  constraint ck_receipts_discount_lte_subtotal
    check (discount <= subtotal),
  constraint ck_receipts_total_formula
    check (total = subtotal - discount + tax),
  constraint ck_receipts_void_state
    check (
      (
        status = 'issued'
        and void_reason is null
        and voided_at is null
      ) or (
        status = 'voided'
        and void_reason is not null
        and btrim(void_reason) <> ''
        and voided_at is not null
      )
    )
);

create index idx_receipts_tenant_branch_issued_at
  on receipts (tenant_id, branch_id, issued_at desc);

create index idx_receipts_tenant_branch_status_issued_at
  on receipts (tenant_id, branch_id, status, issued_at desc);

create index idx_receipts_number
  on receipts (tenant_id, branch_id, number);

create unique index ux_receipts_tenant_branch_appointment_issued
  on receipts (tenant_id, branch_id, appointment_id)
  where appointment_id is not null and status = 'issued';

create table receipt_items (
  id uuid not null,
  tenant_id uuid not null,
  receipt_id uuid not null,
  service_id uuid null,
  description text not null,
  quantity integer not null,
  unit_price numeric(12, 2) not null,
  line_total numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  constraint pk_receipt_items primary key (id),
  constraint fk_receipt_items_receipt
    foreign key (tenant_id, receipt_id)
    references receipts (tenant_id, id)
    on delete cascade,
  constraint fk_receipt_items_service
    foreign key (tenant_id, service_id)
    references services (tenant_id, id)
    on delete restrict,
  constraint ck_receipt_items_description_not_blank
    check (btrim(description) <> ''),
  constraint ck_receipt_items_quantity_positive
    check (quantity >= 1),
  constraint ck_receipt_items_unit_price_non_negative
    check (unit_price >= 0),
  constraint ck_receipt_items_line_total_formula
    check (line_total = quantity * unit_price)
);

create index idx_receipt_items_receipt
  on receipt_items (tenant_id, receipt_id);

create table receipt_payments (
  id uuid not null,
  tenant_id uuid not null,
  receipt_id uuid not null,
  method text not null,
  amount numeric(12, 2) not null,
  reference text null,
  created_at timestamptz not null default now(),
  constraint pk_receipt_payments primary key (id),
  constraint fk_receipt_payments_receipt
    foreign key (tenant_id, receipt_id)
    references receipts (tenant_id, id)
    on delete cascade,
  constraint ck_receipt_payments_method_valid
    check (method in ('cash', 'card', 'transfer', 'other')),
  constraint ck_receipt_payments_amount_positive
    check (amount > 0)
);

create index idx_receipt_payments_receipt
  on receipt_payments (tenant_id, receipt_id);

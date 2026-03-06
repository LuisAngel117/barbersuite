create table email_outbox (
  id uuid primary key,
  tenant_id uuid not null,
  branch_id uuid null,
  kind text not null,
  status text not null,
  to_email text not null,
  subject text not null,
  body_text text null,
  body_html text null,
  dedup_key text not null,
  appointment_id uuid null,
  attempts int not null default 0,
  last_error text null,
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_email_outbox_tenant_dedup_key unique (tenant_id, dedup_key),
  constraint fk_email_outbox_branch
    foreign key (tenant_id, branch_id)
    references branches (tenant_id, id),
  constraint fk_email_outbox_appointment
    foreign key (tenant_id, branch_id, appointment_id)
    references appointments (tenant_id, branch_id, id),
  constraint ck_email_outbox_kind_valid
    check (kind in ('appointment_confirmation', 'appointment_reminder')),
  constraint ck_email_outbox_status_valid
    check (status in ('pending', 'sent', 'failed', 'cancelled')),
  constraint ck_email_outbox_attempts_non_negative
    check (attempts >= 0),
  constraint ck_email_outbox_body_present
    check (body_text is not null or body_html is not null),
  constraint ck_email_outbox_appointment_requires_branch
    check (appointment_id is null or branch_id is not null)
);

create index idx_email_outbox_pending_due
  on email_outbox (scheduled_at)
  where status = 'pending';

create index idx_email_outbox_tenant_created_at
  on email_outbox (tenant_id, created_at desc);

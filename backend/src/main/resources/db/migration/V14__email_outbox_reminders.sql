create index if not exists idx_email_outbox_appt_kind
  on email_outbox (tenant_id, branch_id, appointment_id, kind)
  where appointment_id is not null;

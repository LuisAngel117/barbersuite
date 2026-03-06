alter table email_outbox
  add column if not exists processing_started_at timestamptz null;

alter table email_outbox
  drop constraint if exists ck_email_outbox_status_valid;

alter table email_outbox
  add constraint ck_email_outbox_status_valid
    check (status in ('pending', 'processing', 'sent', 'failed', 'cancelled'));

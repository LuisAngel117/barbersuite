alter table email_outbox
  drop constraint if exists ck_email_outbox_kind_valid;

alter table email_outbox
  add constraint ck_email_outbox_kind_valid
  check (
    kind in (
      'appointment_confirmation',
      'appointment_reminder',
      'appointment_rescheduled',
      'appointment_cancelled'
    )
  );

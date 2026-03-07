create table notification_email_templates (
  id uuid primary key,
  tenant_id uuid not null,
  kind text not null,
  enabled boolean not null default true,
  subject_template text not null,
  body_text_template text null,
  body_html_template text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_notification_email_templates_tenant
    foreign key (tenant_id)
    references tenants (id)
    on delete cascade,
  constraint uq_notification_email_templates_tenant_kind
    unique (tenant_id, kind),
  constraint ck_notification_email_templates_kind_valid
    check (
      kind in (
        'appointment_confirmation',
        'appointment_reminder',
        'appointment_rescheduled',
        'appointment_cancelled'
      )
    ),
  constraint ck_notification_email_templates_body_present
    check (body_text_template is not null or body_html_template is not null)
);

create index idx_notification_email_templates_tenant_kind
  on notification_email_templates (tenant_id, kind);

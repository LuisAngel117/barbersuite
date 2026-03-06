create index if not exists idx_appointments_client
  on appointments (tenant_id, branch_id, client_id, start_at desc);

create index if not exists idx_receipts_client
  on receipts (tenant_id, branch_id, client_id, issued_at desc);

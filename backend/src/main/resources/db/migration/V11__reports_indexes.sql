create index if not exists idx_receipt_items_tenant_service
  on receipt_items (tenant_id, service_id)
  where service_id is not null;

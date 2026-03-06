package com.barbersuite.backend.cash;

import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcReceiptSequenceRepository {

  private final JdbcTemplate jdbcTemplate;

  public JdbcReceiptSequenceRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public long reserveNextNumber(UUID tenantId, UUID branchId, int year) {
    jdbcTemplate.update(
      """
      insert into receipt_sequences (id, tenant_id, branch_id, year, next_seq)
      values (?, ?, ?, ?, 1)
      on conflict (tenant_id, branch_id, year) do nothing
      """,
      UUID.randomUUID(),
      tenantId,
      branchId,
      year
    );

    Integer currentSequence = jdbcTemplate.queryForObject(
      """
      select next_seq
      from receipt_sequences
      where tenant_id = ?
        and branch_id = ?
        and year = ?
      for update
      """,
      Integer.class,
      tenantId,
      branchId,
      year
    );

    if (currentSequence == null) {
      throw new IllegalStateException("Receipt sequence row was not created.");
    }

    jdbcTemplate.update(
      """
      update receipt_sequences
      set next_seq = next_seq + 1
      where tenant_id = ?
        and branch_id = ?
        and year = ?
      """,
      tenantId,
      branchId,
      year
    );

    return currentSequence.longValue();
  }
}

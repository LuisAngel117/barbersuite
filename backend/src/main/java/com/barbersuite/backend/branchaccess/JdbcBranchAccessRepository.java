package com.barbersuite.backend.branchaccess;

import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcBranchAccessRepository {

  private final JdbcTemplate jdbcTemplate;

  public JdbcBranchAccessRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public boolean hasAccess(UUID tenantId, UUID userId, UUID branchId) {
    Long accessCount = jdbcTemplate.queryForObject(
      """
      select count(*)
      from user_branch_access
      where tenant_id = ?
        and user_id = ?
        and branch_id = ?
      """,
      Long.class,
      tenantId,
      userId,
      branchId
    );

    return accessCount != null && accessCount > 0;
  }
}

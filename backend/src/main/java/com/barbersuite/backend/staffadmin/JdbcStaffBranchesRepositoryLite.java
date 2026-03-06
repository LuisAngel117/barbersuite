package com.barbersuite.backend.staffadmin;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcStaffBranchesRepositoryLite {

  private final JdbcTemplate jdbcTemplate;

  public JdbcStaffBranchesRepositoryLite(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public boolean allExistForTenant(UUID tenantId, List<UUID> branchIds) {
    if (branchIds.isEmpty()) {
      return true;
    }

    String placeholders = String.join(", ", Collections.nCopies(branchIds.size(), "?"));
    List<Object> arguments = new ArrayList<>();
    arguments.add(tenantId);
    arguments.addAll(branchIds);

    Long count = jdbcTemplate.queryForObject(
      """
      select count(distinct id)
      from branches
      where tenant_id = ?
        and id in (%s)
      """.formatted(placeholders),
      Long.class,
      arguments.toArray()
    );
    return count != null && count == branchIds.size();
  }
}

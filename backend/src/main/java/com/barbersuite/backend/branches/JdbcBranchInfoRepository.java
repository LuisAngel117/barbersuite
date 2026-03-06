package com.barbersuite.backend.branches;

import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcBranchInfoRepository {

  private final JdbcTemplate jdbcTemplate;

  public JdbcBranchInfoRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public Optional<BranchInfo> findBranchInfo(UUID tenantId, UUID branchId) {
    return jdbcTemplate.query(
      """
      select code, time_zone
      from branches
      where tenant_id = ?
        and id = ?
      """,
      (resultSet, rowNum) -> new BranchInfo(
        resultSet.getString("code"),
        resultSet.getString("time_zone")
      ),
      tenantId,
      branchId
    ).stream().findFirst();
  }

  public Optional<String> findTimeZone(UUID tenantId, UUID branchId) {
    return findBranchInfo(tenantId, branchId).map(BranchInfo::timeZone);
  }

  public record BranchInfo(String code, String timeZone) {
  }
}

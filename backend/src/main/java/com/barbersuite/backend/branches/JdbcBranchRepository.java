package com.barbersuite.backend.branches;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcBranchRepository {

  private static final RowMapper<BranchRow> BRANCH_ROW_MAPPER = JdbcBranchRepository::mapBranchRow;

  private final JdbcTemplate jdbcTemplate;

  public JdbcBranchRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public List<BranchRow> listByTenant(UUID tenantId) {
    return jdbcTemplate.query(
      """
      select id, name, code, time_zone, active
      from branches
      where tenant_id = ?
      order by code asc
      """,
      BRANCH_ROW_MAPPER,
      tenantId
    );
  }

  public Optional<BranchRow> findByTenantAndId(UUID tenantId, UUID branchId) {
    return jdbcTemplate.query(
      """
      select id, name, code, time_zone, active
      from branches
      where tenant_id = ?
        and id = ?
      """,
      BRANCH_ROW_MAPPER,
      tenantId,
      branchId
    ).stream().findFirst();
  }

  public void insert(
    UUID tenantId,
    UUID branchId,
    String name,
    String code,
    String timeZone,
    boolean active
  ) {
    jdbcTemplate.update(
      """
      insert into branches (id, tenant_id, name, code, time_zone, active)
      values (?, ?, ?, ?, ?, ?)
      """,
      branchId,
      tenantId,
      name,
      code,
      timeZone,
      active
    );
  }

  public int update(UUID tenantId, UUID branchId, String name, String timeZone, boolean active) {
    return jdbcTemplate.update(
      """
      update branches
      set name = ?,
          time_zone = ?,
          active = ?
      where tenant_id = ?
        and id = ?
      """,
      name,
      timeZone,
      active,
      tenantId,
      branchId
    );
  }

  public void grantUserBranchAccess(UUID accessId, UUID tenantId, UUID userId, UUID branchId) {
    jdbcTemplate.update(
      """
      insert into user_branch_access (id, tenant_id, user_id, branch_id)
      values (?, ?, ?, ?)
      on conflict (tenant_id, user_id, branch_id) do nothing
      """,
      accessId,
      tenantId,
      userId,
      branchId
    );
  }

  private static BranchRow mapBranchRow(ResultSet resultSet, int rowNum) throws SQLException {
    return new BranchRow(
      resultSet.getObject("id", UUID.class),
      resultSet.getString("name"),
      resultSet.getString("code"),
      resultSet.getString("time_zone"),
      resultSet.getBoolean("active")
    );
  }

  public record BranchRow(
    UUID id,
    String name,
    String code,
    String timeZone,
    boolean active
  ) {
  }
}

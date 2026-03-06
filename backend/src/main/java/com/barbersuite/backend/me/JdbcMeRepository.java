package com.barbersuite.backend.me;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcMeRepository {

  private static final RowMapper<TenantRow> TENANT_ROW_MAPPER = JdbcMeRepository::mapTenantRow;
  private static final RowMapper<UserRow> USER_ROW_MAPPER = JdbcMeRepository::mapUserRow;
  private static final RowMapper<BranchRow> BRANCH_ROW_MAPPER = JdbcMeRepository::mapBranchRow;

  private final JdbcTemplate jdbcTemplate;

  public JdbcMeRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public Optional<TenantRow> findTenantById(UUID tenantId) {
    return jdbcTemplate.query(
      """
      select id, name
      from tenants
      where id = ?
      """,
      TENANT_ROW_MAPPER,
      tenantId
    ).stream().findFirst();
  }

  public Optional<UserRow> findUserByTenantIdAndId(UUID tenantId, UUID userId) {
    return jdbcTemplate.query(
      """
      select id, full_name, email
      from users
      where tenant_id = ?
        and id = ?
      """,
      USER_ROW_MAPPER,
      tenantId,
      userId
    ).stream().findFirst();
  }

  public List<BranchRow> findAccessibleBranches(UUID tenantId, UUID userId) {
    return jdbcTemplate.query(
      """
      select b.id, b.name, b.code, b.time_zone, b.active
      from user_branch_access uba
      join branches b
        on b.tenant_id = uba.tenant_id
       and b.id = uba.branch_id
      where uba.tenant_id = ?
        and uba.user_id = ?
      order by b.code asc
      """,
      BRANCH_ROW_MAPPER,
      tenantId,
      userId
    );
  }

  private static TenantRow mapTenantRow(ResultSet resultSet, int rowNum) throws SQLException {
    return new TenantRow(
      resultSet.getObject("id", UUID.class),
      resultSet.getString("name")
    );
  }

  private static UserRow mapUserRow(ResultSet resultSet, int rowNum) throws SQLException {
    return new UserRow(
      resultSet.getObject("id", UUID.class),
      resultSet.getString("full_name"),
      resultSet.getString("email")
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

  record TenantRow(UUID id, String name) {
  }

  record UserRow(UUID id, String fullName, String email) {
  }

  record BranchRow(UUID id, String name, String code, String timeZone, boolean active) {
  }
}

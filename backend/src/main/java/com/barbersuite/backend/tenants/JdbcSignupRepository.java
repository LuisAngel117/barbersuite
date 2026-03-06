package com.barbersuite.backend.tenants;

import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcSignupRepository {

  private final JdbcTemplate jdbcTemplate;

  public JdbcSignupRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public boolean existsUserByEmail(String email) {
    return Boolean.TRUE.equals(jdbcTemplate.queryForObject(
      """
      select exists (
        select 1
        from users
        where lower(email) = lower(?)
      )
      """,
      Boolean.class,
      email
    ));
  }

  public void insertTenant(UUID tenantId, String tenantName) {
    jdbcTemplate.update(
      """
      insert into tenants (id, name)
      values (?, ?)
      """,
      tenantId,
      tenantName
    );
  }

  public void insertBranch(
    UUID branchId,
    UUID tenantId,
    String branchCode,
    String branchName,
    String timeZone
  ) {
    jdbcTemplate.update(
      """
      insert into branches (id, tenant_id, code, name, time_zone, active)
      values (?, ?, ?, ?, ?, ?)
      """,
      branchId,
      tenantId,
      branchCode,
      branchName,
      timeZone,
      true
    );
  }

  public void insertUser(
    UUID userId,
    UUID tenantId,
    String fullName,
    String adminEmail,
    String passwordHash
  ) {
    jdbcTemplate.update(
      """
      insert into users (id, tenant_id, full_name, email, password_hash)
      values (?, ?, ?, ?, ?)
      """,
      userId,
      tenantId,
      fullName,
      adminEmail,
      passwordHash
    );
  }

  public void insertUserRole(UUID tenantId, UUID userId, String role) {
    jdbcTemplate.update(
      """
      insert into user_roles (tenant_id, user_id, role)
      values (?, ?, ?)
      """,
      tenantId,
      userId,
      role
    );
  }

  public void insertUserBranchAccess(UUID accessId, UUID tenantId, UUID userId, UUID branchId) {
    jdbcTemplate.update(
      """
      insert into user_branch_access (id, tenant_id, user_id, branch_id)
      values (?, ?, ?, ?)
      """,
      accessId,
      tenantId,
      userId,
      branchId
    );
  }
}

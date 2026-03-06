package com.barbersuite.backend.staff;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcBarbersRepository {

  private static final RowMapper<BarberRow> BARBER_ROW_MAPPER = JdbcBarbersRepository::mapBarberRow;

  private final JdbcTemplate jdbcTemplate;

  public JdbcBarbersRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public List<BarberRow> listByTenantAndBranch(UUID tenantId, UUID branchId) {
    return jdbcTemplate.query(
      """
      select u.id, u.full_name, u.active
      from users u
      join user_roles ur
        on ur.tenant_id = u.tenant_id
       and ur.user_id = u.id
       and ur.role = 'BARBER'
      join user_branch_access uba
        on uba.tenant_id = u.tenant_id
       and uba.user_id = u.id
       and uba.branch_id = ?
      where u.tenant_id = ?
      order by u.full_name asc
      """,
      BARBER_ROW_MAPPER,
      branchId,
      tenantId
    );
  }

  public boolean existsByTenantAndBranchAndUserId(UUID tenantId, UUID branchId, UUID userId) {
    return Boolean.TRUE.equals(jdbcTemplate.queryForObject(
      """
      select exists (
        select 1
        from users u
        join user_roles ur
          on ur.tenant_id = u.tenant_id
         and ur.user_id = u.id
         and ur.role = 'BARBER'
        join user_branch_access uba
          on uba.tenant_id = u.tenant_id
         and uba.user_id = u.id
         and uba.branch_id = ?
        where u.tenant_id = ?
          and u.id = ?
      )
      """,
      Boolean.class,
      branchId,
      tenantId,
      userId
    ));
  }

  public Optional<BarberRow> findByTenantAndBranchAndUserId(
    UUID tenantId,
    UUID branchId,
    UUID userId
  ) {
    return jdbcTemplate.query(
      """
      select u.id, u.full_name, u.active
      from users u
      join user_roles ur
        on ur.tenant_id = u.tenant_id
       and ur.user_id = u.id
       and ur.role = 'BARBER'
      join user_branch_access uba
        on uba.tenant_id = u.tenant_id
       and uba.user_id = u.id
       and uba.branch_id = ?
      where u.tenant_id = ?
        and u.id = ?
      """,
      BARBER_ROW_MAPPER,
      branchId,
      tenantId,
      userId
    ).stream().findFirst();
  }

  private static BarberRow mapBarberRow(ResultSet resultSet, int rowNum) throws SQLException {
    return new BarberRow(
      resultSet.getObject("id", UUID.class),
      resultSet.getString("full_name"),
      resultSet.getBoolean("active")
    );
  }

  public record BarberRow(UUID id, String fullName, boolean active) {
  }
}

package com.barbersuite.backend.staffadmin;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcStaffBarbersRepository {

  private static final RowMapper<StaffBarberRow> STAFF_BARBER_ROW_MAPPER =
    JdbcStaffBarbersRepository::mapStaffBarberRow;

  private final JdbcTemplate jdbcTemplate;

  public JdbcStaffBarbersRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public void insertUser(
    UUID tenantId,
    UUID userId,
    String fullName,
    String email,
    String phone,
    String passwordHash,
    boolean active
  ) {
    jdbcTemplate.update(
      """
      insert into users (
        id,
        tenant_id,
        full_name,
        email,
        phone,
        password_hash,
        active
      )
      values (?, ?, ?, ?, ?, ?, ?)
      """,
      userId,
      tenantId,
      fullName,
      email,
      phone,
      passwordHash,
      active
    );
  }

  public void insertBarberRole(UUID tenantId, UUID barberId) {
    jdbcTemplate.update(
      """
      insert into user_roles (tenant_id, user_id, role)
      values (?, ?, 'BARBER')
      on conflict (tenant_id, user_id, role) do nothing
      """,
      tenantId,
      barberId
    );
  }

  public int updateUserFields(
    UUID tenantId,
    UUID barberId,
    String fullName,
    String phone,
    String passwordHash,
    boolean active
  ) {
    return jdbcTemplate.update(
      """
      update users
      set full_name = ?,
          phone = ?,
          password_hash = ?,
          active = ?
      where tenant_id = ?
        and id = ?
      """,
      fullName,
      phone,
      passwordHash,
      active,
      tenantId,
      barberId
    );
  }

  public Optional<StaffBarberRow> findBarberById(UUID tenantId, UUID barberId) {
    return jdbcTemplate.query(
      """
      select u.id, u.full_name, u.email, u.phone, u.password_hash, u.active
      from users u
      join user_roles ur
        on ur.tenant_id = u.tenant_id
       and ur.user_id = u.id
       and ur.role = 'BARBER'
      where u.tenant_id = ?
        and u.id = ?
      """,
      STAFF_BARBER_ROW_MAPPER,
      tenantId,
      barberId
    ).stream().findFirst();
  }

  public List<StaffBarberRow> listBarbers(UUID tenantId, StaffBarberFilter filter) {
    StringBuilder sqlBuilder = new StringBuilder(
      """
      select u.id, u.full_name, u.email, u.phone, null as password_hash, u.active
      from users u
      join user_roles ur
        on ur.tenant_id = u.tenant_id
       and ur.user_id = u.id
       and ur.role = 'BARBER'
      where u.tenant_id = ?
      """
    );
    List<Object> arguments = new ArrayList<>();
    arguments.add(tenantId);

    if (filter.active() != null) {
      sqlBuilder.append(" and u.active = ?");
      arguments.add(filter.active());
    }

    if (filter.query() != null) {
      sqlBuilder.append(
        """
          and (
            lower(u.full_name) like ?
            or lower(u.email) like ?
            or lower(coalesce(u.phone, '')) like ?
          )
        """
      );
      String likeValue = "%" + filter.query().toLowerCase() + "%";
      arguments.add(likeValue);
      arguments.add(likeValue);
      arguments.add(likeValue);
    }

    if (filter.branchId() != null) {
      sqlBuilder.append(
        """
          and exists (
            select 1
            from user_branch_access uba
            where uba.tenant_id = u.tenant_id
              and uba.user_id = u.id
              and uba.branch_id = ?
          )
        """
      );
      arguments.add(filter.branchId());
    }

    sqlBuilder.append(" order by u.full_name asc");
    return jdbcTemplate.query(
      sqlBuilder.toString(),
      STAFF_BARBER_ROW_MAPPER,
      arguments.toArray()
    );
  }

  public boolean emailExistsGlobal(String email) {
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

  private static StaffBarberRow mapStaffBarberRow(ResultSet resultSet, int rowNum) throws SQLException {
    return new StaffBarberRow(
      resultSet.getObject("id", UUID.class),
      resultSet.getString("full_name"),
      resultSet.getString("email"),
      resultSet.getString("phone"),
      resultSet.getString("password_hash"),
      resultSet.getBoolean("active")
    );
  }

  public record StaffBarberRow(
    UUID id,
    String fullName,
    String email,
    String phone,
    String passwordHash,
    boolean active
  ) {
  }

  public record StaffBarberFilter(Boolean active, String query, UUID branchId) {
  }
}

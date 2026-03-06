package com.barbersuite.backend.auth;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcAuthUserRepository {

  private static final RowMapper<AuthUserRow> USER_ROW_MAPPER = JdbcAuthUserRepository::mapUserRow;

  private final JdbcTemplate jdbcTemplate;

  public JdbcAuthUserRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public Optional<AuthUser> findByTenantIdAndEmail(UUID tenantId, String email) {
    List<AuthUserRow> userRows = jdbcTemplate.query(
      """
      select id, tenant_id, email, password_hash
      from users
      where tenant_id = ?
        and lower(email) = lower(?)
      """,
      USER_ROW_MAPPER,
      tenantId,
      email
    );

    if (userRows.isEmpty()) {
      return Optional.empty();
    }

    AuthUserRow userRow = userRows.getFirst();
    List<String> roles = jdbcTemplate.query(
      """
      select role
      from user_roles
      where tenant_id = ?
        and user_id = ?
      order by role
      """,
      (resultSet, rowNum) -> resultSet.getString("role"),
      tenantId,
      userRow.userId()
    );

    return Optional.of(new AuthUser(
      userRow.tenantId(),
      userRow.userId(),
      userRow.email(),
      userRow.passwordHash(),
      List.copyOf(roles)
    ));
  }

  private static AuthUserRow mapUserRow(ResultSet resultSet, int rowNum) throws SQLException {
    return new AuthUserRow(
      resultSet.getObject("tenant_id", UUID.class),
      resultSet.getObject("id", UUID.class),
      resultSet.getString("email"),
      resultSet.getString("password_hash")
    );
  }

  private record AuthUserRow(UUID tenantId, UUID userId, String email, String passwordHash) {
  }
}

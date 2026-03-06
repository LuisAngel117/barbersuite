package com.barbersuite.backend.clients;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcClientsRepository {

  private static final RowMapper<ClientRow> CLIENT_ROW_MAPPER = JdbcClientsRepository::mapClientRow;

  private final JdbcTemplate jdbcTemplate;

  public JdbcClientsRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public void insert(
    UUID tenantId,
    UUID branchId,
    UUID clientId,
    String fullName,
    String phone,
    String email,
    String notes,
    boolean active
  ) {
    jdbcTemplate.update(
      """
      insert into clients (
        id,
        tenant_id,
        branch_id,
        full_name,
        phone,
        email,
        notes,
        active,
        created_at,
        updated_at
      )
      values (?, ?, ?, ?, ?, ?, ?, ?, now(), now())
      """,
      clientId,
      tenantId,
      branchId,
      fullName,
      phone,
      email,
      notes,
      active
    );
  }

  public Optional<ClientRow> findById(UUID tenantId, UUID branchId, UUID clientId) {
    return jdbcTemplate.query(
      """
      select id, full_name, phone, email, notes, active, created_at
      from clients
      where tenant_id = ?
        and branch_id = ?
        and id = ?
      """,
      CLIENT_ROW_MAPPER,
      tenantId,
      branchId,
      clientId
    ).stream().findFirst();
  }

  public List<ClientRow> list(UUID tenantId, UUID branchId, String query, int page, int size) {
    QueryParts queryParts = queryParts(
      """
      select id, full_name, phone, email, notes, active, created_at
      from clients
      where tenant_id = ?
        and branch_id = ?
      """,
      tenantId,
      branchId,
      query
    );

    queryParts.sqlBuilder().append(
      """
      order by created_at desc
      limit ?
      offset ?
      """
    );
    queryParts.arguments().add(size);
    queryParts.arguments().add((long) page * size);

    return jdbcTemplate.query(
      queryParts.sqlBuilder().toString(),
      CLIENT_ROW_MAPPER,
      queryParts.arguments().toArray()
    );
  }

  public long count(UUID tenantId, UUID branchId, String query) {
    QueryParts queryParts = queryParts(
      """
      select count(*)
      from clients
      where tenant_id = ?
        and branch_id = ?
      """,
      tenantId,
      branchId,
      query
    );

    Long count = jdbcTemplate.queryForObject(
      queryParts.sqlBuilder().toString(),
      Long.class,
      queryParts.arguments().toArray()
    );
    return count == null ? 0L : count;
  }

  public int update(
    UUID tenantId,
    UUID branchId,
    UUID clientId,
    String fullName,
    String phone,
    String email,
    String notes,
    boolean active
  ) {
    return jdbcTemplate.update(
      """
      update clients
      set full_name = ?,
          phone = ?,
          email = ?,
          notes = ?,
          active = ?,
          updated_at = now()
      where tenant_id = ?
        and branch_id = ?
        and id = ?
      """,
      fullName,
      phone,
      email,
      notes,
      active,
      tenantId,
      branchId,
      clientId
    );
  }

  private QueryParts queryParts(
    String baseSql,
    UUID tenantId,
    UUID branchId,
    String query
  ) {
    StringBuilder sqlBuilder = new StringBuilder(baseSql);
    List<Object> arguments = new ArrayList<>();
    arguments.add(tenantId);
    arguments.add(branchId);

    String normalizedQuery = query == null ? null : query.trim();
    if (normalizedQuery != null && !normalizedQuery.isEmpty()) {
      sqlBuilder.append(
        """
          and (
            lower(full_name) like ?
            or phone like ?
            or lower(email) like ?
          )
        """
      );
      String textLike = "%" + normalizedQuery.toLowerCase(Locale.ROOT) + "%";
      String phoneLike = "%" + normalizedQuery + "%";
      arguments.add(textLike);
      arguments.add(phoneLike);
      arguments.add(textLike);
    }

    return new QueryParts(sqlBuilder, arguments);
  }

  private static ClientRow mapClientRow(ResultSet resultSet, int rowNum) throws SQLException {
    return new ClientRow(
      resultSet.getObject("id", UUID.class),
      resultSet.getString("full_name"),
      resultSet.getString("phone"),
      resultSet.getString("email"),
      resultSet.getString("notes"),
      resultSet.getBoolean("active"),
      resultSet.getTimestamp("created_at").toInstant()
    );
  }

  public record ClientRow(
    UUID id,
    String fullName,
    String phone,
    String email,
    String notes,
    boolean active,
    Instant createdAt
  ) {
  }

  private record QueryParts(StringBuilder sqlBuilder, List<Object> arguments) {
  }
}

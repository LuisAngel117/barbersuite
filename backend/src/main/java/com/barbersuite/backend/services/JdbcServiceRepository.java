package com.barbersuite.backend.services;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcServiceRepository {

  private static final RowMapper<ServiceRow> SERVICE_ROW_MAPPER = JdbcServiceRepository::mapServiceRow;

  private final JdbcTemplate jdbcTemplate;

  public JdbcServiceRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public List<ServiceRow> listByTenant(UUID tenantId) {
    return jdbcTemplate.query(
      """
      select id, name, duration_minutes, price, active
      from services
      where tenant_id = ?
      order by active desc, name asc
      """,
      SERVICE_ROW_MAPPER,
      tenantId
    );
  }

  public Optional<ServiceRow> findByTenantAndId(UUID tenantId, UUID serviceId) {
    return jdbcTemplate.query(
      """
      select id, name, duration_minutes, price, active
      from services
      where tenant_id = ?
        and id = ?
      """,
      SERVICE_ROW_MAPPER,
      tenantId,
      serviceId
    ).stream().findFirst();
  }

  public Optional<Integer> findDurationMinutesByTenantAndId(UUID tenantId, UUID serviceId) {
    return jdbcTemplate.query(
      """
      select duration_minutes
      from services
      where tenant_id = ?
        and id = ?
      """,
      (resultSet, rowNum) -> resultSet.getInt("duration_minutes"),
      tenantId,
      serviceId
    ).stream().findFirst();
  }

  public void insert(
    UUID serviceId,
    UUID tenantId,
    String name,
    int durationMinutes,
    BigDecimal price,
    boolean active
  ) {
    jdbcTemplate.update(
      """
      insert into services (
        id,
        tenant_id,
        name,
        duration_minutes,
        price,
        active,
        created_at,
        updated_at
      )
      values (?, ?, ?, ?, ?, ?, now(), now())
      """,
      serviceId,
      tenantId,
      name,
      durationMinutes,
      price,
      active
    );
  }

  public int update(
    UUID tenantId,
    UUID serviceId,
    String name,
    int durationMinutes,
    BigDecimal price,
    boolean active
  ) {
    return jdbcTemplate.update(
      """
      update services
      set name = ?,
          duration_minutes = ?,
          price = ?,
          active = ?,
          updated_at = now()
      where tenant_id = ?
        and id = ?
      """,
      name,
      durationMinutes,
      price,
      active,
      tenantId,
      serviceId
    );
  }

  private static ServiceRow mapServiceRow(ResultSet resultSet, int rowNum) throws SQLException {
    return new ServiceRow(
      resultSet.getObject("id", UUID.class),
      resultSet.getString("name"),
      resultSet.getInt("duration_minutes"),
      resultSet.getBigDecimal("price"),
      resultSet.getBoolean("active")
    );
  }

  public record ServiceRow(
    UUID id,
    String name,
    int durationMinutes,
    BigDecimal price,
    boolean active
  ) {
  }
}

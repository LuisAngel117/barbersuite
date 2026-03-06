package com.barbersuite.backend.staffadmin;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcStaffBarberServicesRepository {

  private static final RowMapper<AssignedServiceRow> ASSIGNED_SERVICE_ROW_MAPPER =
    JdbcStaffBarberServicesRepository::mapAssignedServiceRow;

  private final JdbcTemplate jdbcTemplate;

  public JdbcStaffBarberServicesRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public void replaceServices(UUID tenantId, UUID barberId, List<UUID> serviceIds) {
    jdbcTemplate.update(
      """
      delete from barber_services
      where tenant_id = ?
        and barber_id = ?
      """,
      tenantId,
      barberId
    );

    for (UUID serviceId : serviceIds) {
      jdbcTemplate.update(
        """
        insert into barber_services (id, tenant_id, barber_id, service_id)
        values (?, ?, ?, ?)
        """,
        UUID.randomUUID(),
        tenantId,
        barberId,
        serviceId
      );
    }
  }

  public Map<UUID, List<AssignedServiceRow>> listServicesForBarbers(UUID tenantId, List<UUID> barberIds) {
    if (barberIds.isEmpty()) {
      return Collections.emptyMap();
    }

    String placeholders = String.join(", ", Collections.nCopies(barberIds.size(), "?"));
    List<Object> arguments = new ArrayList<>();
    arguments.add(tenantId);
    arguments.addAll(barberIds);

    List<AssignedServiceRow> rows = jdbcTemplate.query(
      """
      select bs.barber_id, s.id, s.name, s.price, s.duration_minutes, s.active
      from barber_services bs
      join services s
        on s.tenant_id = bs.tenant_id
       and s.id = bs.service_id
      where bs.tenant_id = ?
        and bs.barber_id in (%s)
      order by s.name asc
      """.formatted(placeholders),
      ASSIGNED_SERVICE_ROW_MAPPER,
      arguments.toArray()
    );

    Map<UUID, List<AssignedServiceRow>> result = new LinkedHashMap<>();
    for (AssignedServiceRow row : rows) {
      result.computeIfAbsent(row.barberId(), ignored -> new ArrayList<>()).add(row);
    }
    return result;
  }

  private static AssignedServiceRow mapAssignedServiceRow(ResultSet resultSet, int rowNum)
    throws SQLException {
    return new AssignedServiceRow(
      resultSet.getObject("barber_id", UUID.class),
      resultSet.getObject("id", UUID.class),
      resultSet.getString("name"),
      resultSet.getBigDecimal("price"),
      resultSet.getInt("duration_minutes"),
      resultSet.getBoolean("active")
    );
  }

  public record AssignedServiceRow(
    UUID barberId,
    UUID id,
    String name,
    BigDecimal price,
    int durationMinutes,
    boolean active
  ) {
  }
}

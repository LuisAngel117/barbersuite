package com.barbersuite.backend.appointments;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcAppointmentsRepository {

  private static final RowMapper<AppointmentRow> APPOINTMENT_ROW_MAPPER =
    JdbcAppointmentsRepository::mapAppointmentRow;

  private final JdbcTemplate jdbcTemplate;

  public JdbcAppointmentsRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public void insert(
    UUID tenantId,
    UUID branchId,
    UUID appointmentId,
    UUID clientId,
    UUID barberId,
    UUID serviceId,
    AppointmentStatus status,
    Instant startAt,
    Instant endAt,
    String notes
  ) {
    jdbcTemplate.update(
      """
      insert into appointments (
        id,
        tenant_id,
        branch_id,
        client_id,
        barber_id,
        service_id,
        status,
        start_at,
        end_at,
        notes,
        created_at,
        updated_at
      )
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), now())
      """,
      appointmentId,
      tenantId,
      branchId,
      clientId,
      barberId,
      serviceId,
      status.name(),
      Timestamp.from(startAt),
      Timestamp.from(endAt),
      notes
    );
  }

  public Optional<AppointmentRow> findByTenantBranchAndId(
    UUID tenantId,
    UUID branchId,
    UUID appointmentId
  ) {
    return jdbcTemplate.query(
      """
      select id, client_id, barber_id, service_id, status, start_at, end_at, notes, created_at, updated_at
      from appointments
      where tenant_id = ?
        and branch_id = ?
        and id = ?
      """,
      APPOINTMENT_ROW_MAPPER,
      tenantId,
      branchId,
      appointmentId
    ).stream().findFirst();
  }

  public List<AppointmentRow> list(
    UUID tenantId,
    UUID branchId,
    AppointmentFilter filter
  ) {
    QueryParts queryParts = queryParts(
      """
      select a.id, a.client_id, a.barber_id, a.service_id, a.status, a.start_at, a.end_at, a.notes, a.created_at, a.updated_at
      from appointments a
      join clients c
        on c.tenant_id = a.tenant_id
       and c.branch_id = a.branch_id
       and c.id = a.client_id
      where a.tenant_id = ?
        and a.branch_id = ?
      """,
      tenantId,
      branchId,
      filter
    );

    queryParts.sqlBuilder().append(" order by a.start_at asc, a.created_at asc");
    return jdbcTemplate.query(
      queryParts.sqlBuilder().toString(),
      APPOINTMENT_ROW_MAPPER,
      queryParts.arguments().toArray()
    );
  }

  public int update(
    UUID tenantId,
    UUID branchId,
    UUID appointmentId,
    UUID clientId,
    UUID barberId,
    UUID serviceId,
    AppointmentStatus status,
    Instant startAt,
    Instant endAt,
    String notes
  ) {
    return jdbcTemplate.update(
      """
      update appointments
      set client_id = ?,
          barber_id = ?,
          service_id = ?,
          status = ?,
          start_at = ?,
          end_at = ?,
          notes = ?,
          updated_at = now()
      where tenant_id = ?
        and branch_id = ?
        and id = ?
      """,
      clientId,
      barberId,
      serviceId,
      status.name(),
      Timestamp.from(startAt),
      Timestamp.from(endAt),
      notes,
      tenantId,
      branchId,
      appointmentId
    );
  }

  private QueryParts queryParts(
    String baseSql,
    UUID tenantId,
    UUID branchId,
    AppointmentFilter filter
  ) {
    StringBuilder sqlBuilder = new StringBuilder(baseSql);
    List<Object> arguments = new ArrayList<>();
    arguments.add(tenantId);
    arguments.add(branchId);

    if (filter.fromInclusive() != null) {
      sqlBuilder.append(" and a.start_at >= ?");
      arguments.add(Timestamp.from(filter.fromInclusive()));
    }

    if (filter.toExclusive() != null) {
      sqlBuilder.append(" and a.start_at < ?");
      arguments.add(Timestamp.from(filter.toExclusive()));
    }

    if (filter.barberId() != null) {
      sqlBuilder.append(" and a.barber_id = ?");
      arguments.add(filter.barberId());
    }

    if (filter.status() != null) {
      sqlBuilder.append(" and a.status = ?");
      arguments.add(filter.status().name());
    }

    if (filter.query() != null) {
      sqlBuilder.append(
        """
          and (
            lower(c.full_name) like ?
            or c.phone like ?
            or lower(c.email) like ?
          )
        """
      );
      String likeValue = "%" + filter.query().toLowerCase() + "%";
      String phoneLike = "%" + filter.query() + "%";
      arguments.add(likeValue);
      arguments.add(phoneLike);
      arguments.add(likeValue);
    }

    return new QueryParts(sqlBuilder, arguments);
  }

  private static AppointmentRow mapAppointmentRow(ResultSet resultSet, int rowNum) throws SQLException {
    return new AppointmentRow(
      resultSet.getObject("id", UUID.class),
      resultSet.getObject("client_id", UUID.class),
      resultSet.getObject("barber_id", UUID.class),
      resultSet.getObject("service_id", UUID.class),
      AppointmentStatus.parse(resultSet.getString("status")),
      resultSet.getTimestamp("start_at").toInstant(),
      resultSet.getTimestamp("end_at").toInstant(),
      resultSet.getString("notes"),
      resultSet.getTimestamp("created_at").toInstant(),
      resultSet.getTimestamp("updated_at").toInstant()
    );
  }

  public record AppointmentRow(
    UUID id,
    UUID clientId,
    UUID barberId,
    UUID serviceId,
    AppointmentStatus status,
    Instant startAt,
    Instant endAt,
    String notes,
    Instant createdAt,
    Instant updatedAt
  ) {
  }

  public record AppointmentFilter(
    Instant fromInclusive,
    Instant toExclusive,
    UUID barberId,
    AppointmentStatus status,
    String query
  ) {
  }

  private record QueryParts(StringBuilder sqlBuilder, List<Object> arguments) {
  }
}

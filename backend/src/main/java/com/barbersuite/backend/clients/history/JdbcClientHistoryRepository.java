package com.barbersuite.backend.clients.history;

import com.barbersuite.backend.appointments.AppointmentStatus;
import com.barbersuite.backend.cash.ReceiptStatus;
import java.math.BigDecimal;
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
public class JdbcClientHistoryRepository {

  private static final RowMapper<ClientRow> CLIENT_ROW_MAPPER = JdbcClientHistoryRepository::mapClientRow;
  private static final RowMapper<AppointmentRow> APPOINTMENT_ROW_MAPPER =
    JdbcClientHistoryRepository::mapAppointmentRow;
  private static final RowMapper<ReceiptRow> RECEIPT_ROW_MAPPER = JdbcClientHistoryRepository::mapReceiptRow;

  private final JdbcTemplate jdbcTemplate;

  public JdbcClientHistoryRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public Optional<ClientRow> findClient(UUID tenantId, UUID branchId, UUID clientId) {
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

  public List<AppointmentRow> listAppointments(
    UUID tenantId,
    UUID branchId,
    UUID clientId,
    Instant fromInclusive,
    Instant toExclusive,
    int limit
  ) {
    StringBuilder sql = new StringBuilder(
      """
      select a.id,
             a.status,
             a.start_at,
             a.end_at,
             a.barber_id,
             u.full_name as barber_name,
             a.service_id,
             s.name as service_name
      from appointments a
      join users u
        on u.tenant_id = a.tenant_id
       and u.id = a.barber_id
      join services s
        on s.tenant_id = a.tenant_id
       and s.id = a.service_id
      where a.tenant_id = ?
        and a.branch_id = ?
        and a.client_id = ?
      """
    );
    List<Object> params = new ArrayList<>(List.of(tenantId, branchId, clientId));
    appendInstantRange(sql, params, "a.start_at", fromInclusive, toExclusive);
    sql.append(" order by a.start_at desc limit ?");
    params.add(limit);

    return jdbcTemplate.query(sql.toString(), APPOINTMENT_ROW_MAPPER, params.toArray());
  }

  public List<ReceiptRow> listReceipts(
    UUID tenantId,
    UUID branchId,
    UUID clientId,
    Instant fromInclusive,
    Instant toExclusive,
    int limit
  ) {
    StringBuilder sql = new StringBuilder(
      """
      select r.id,
             r.number,
             r.status,
             r.issued_at,
             r.total
      from receipts r
      where r.tenant_id = ?
        and r.branch_id = ?
        and r.client_id = ?
      """
    );
    List<Object> params = new ArrayList<>(List.of(tenantId, branchId, clientId));
    appendInstantRange(sql, params, "r.issued_at", fromInclusive, toExclusive);
    sql.append(" order by r.issued_at desc limit ?");
    params.add(limit);

    return jdbcTemplate.query(sql.toString(), RECEIPT_ROW_MAPPER, params.toArray());
  }

  public StatsRow stats(
    UUID tenantId,
    UUID branchId,
    UUID clientId,
    Instant fromInclusive,
    Instant toExclusive
  ) {
    StringBuilder appointmentsSql = new StringBuilder(
      """
      select count(*) filter (where status = 'completed')::int as total_visits,
             count(*) filter (where status = 'no_show')::int as no_shows
      from appointments
      where tenant_id = ?
        and branch_id = ?
        and client_id = ?
      """
    );
    List<Object> appointmentParams = new ArrayList<>(List.of(tenantId, branchId, clientId));
    appendInstantRange(appointmentsSql, appointmentParams, "start_at", fromInclusive, toExclusive);

    AppointmentStatsAggregate appointmentStats = jdbcTemplate.queryForObject(
      appointmentsSql.toString(),
      (resultSet, rowNum) -> new AppointmentStatsAggregate(
        resultSet.getInt("total_visits"),
        resultSet.getInt("no_shows")
      ),
      appointmentParams.toArray()
    );

    StringBuilder receiptsSql = new StringBuilder(
      """
      select coalesce(sum(total), 0) as total_spend
      from receipts
      where tenant_id = ?
        and branch_id = ?
        and client_id = ?
        and status = 'issued'
      """
    );
    List<Object> receiptParams = new ArrayList<>(List.of(tenantId, branchId, clientId));
    appendInstantRange(receiptsSql, receiptParams, "issued_at", fromInclusive, toExclusive);

    BigDecimal totalSpend = jdbcTemplate.queryForObject(
      receiptsSql.toString(),
      BigDecimal.class,
      receiptParams.toArray()
    );

    return new StatsRow(
      appointmentStats == null ? 0 : appointmentStats.totalVisits(),
      appointmentStats == null ? 0 : appointmentStats.noShows(),
      totalSpend == null ? BigDecimal.ZERO : totalSpend
    );
  }

  private void appendInstantRange(
    StringBuilder sql,
    List<Object> params,
    String column,
    Instant fromInclusive,
    Instant toExclusive
  ) {
    if (fromInclusive != null) {
      sql.append(" and ").append(column).append(" >= ?");
      params.add(Timestamp.from(fromInclusive));
    }
    if (toExclusive != null) {
      sql.append(" and ").append(column).append(" < ?");
      params.add(Timestamp.from(toExclusive));
    }
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

  private static AppointmentRow mapAppointmentRow(ResultSet resultSet, int rowNum)
    throws SQLException {
    return new AppointmentRow(
      resultSet.getObject("id", UUID.class),
      AppointmentStatus.valueOf(resultSet.getString("status")),
      resultSet.getTimestamp("start_at").toInstant(),
      resultSet.getTimestamp("end_at").toInstant(),
      resultSet.getObject("barber_id", UUID.class),
      resultSet.getString("barber_name"),
      resultSet.getObject("service_id", UUID.class),
      resultSet.getString("service_name")
    );
  }

  private static ReceiptRow mapReceiptRow(ResultSet resultSet, int rowNum) throws SQLException {
    return new ReceiptRow(
      resultSet.getObject("id", UUID.class),
      resultSet.getString("number"),
      ReceiptStatus.valueOf(resultSet.getString("status")),
      resultSet.getTimestamp("issued_at").toInstant(),
      resultSet.getBigDecimal("total")
    );
  }

  private record AppointmentStatsAggregate(int totalVisits, int noShows) {
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

  public record AppointmentRow(
    UUID id,
    AppointmentStatus status,
    Instant startAt,
    Instant endAt,
    UUID barberId,
    String barberName,
    UUID serviceId,
    String serviceName
  ) {
  }

  public record ReceiptRow(
    UUID id,
    String number,
    ReceiptStatus status,
    Instant issuedAt,
    BigDecimal total
  ) {
  }

  public record StatsRow(int totalVisits, int noShows, BigDecimal totalSpend) {
  }
}

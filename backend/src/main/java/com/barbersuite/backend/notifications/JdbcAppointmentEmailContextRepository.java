package com.barbersuite.backend.notifications;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcAppointmentEmailContextRepository {

  private final JdbcTemplate jdbcTemplate;

  public JdbcAppointmentEmailContextRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public Optional<AppointmentEmailContext> findByTenantBranchAndAppointmentId(
    UUID tenantId,
    UUID branchId,
    UUID appointmentId
  ) {
    return jdbcTemplate.query(
      """
      select a.id as appointment_id,
             b.id as branch_id,
             b.name as branch_name,
             b.code as branch_code,
             b.time_zone as branch_time_zone,
             a.start_at,
             a.end_at,
             u.full_name as barber_full_name,
             s.name as service_name,
             nullif(btrim(c.email), '') as client_email,
             c.full_name as client_full_name
      from appointments a
      join branches b
        on b.tenant_id = a.tenant_id
       and b.id = a.branch_id
      join users u
        on u.tenant_id = a.tenant_id
       and u.id = a.barber_id
      join services s
        on s.tenant_id = a.tenant_id
       and s.id = a.service_id
      join clients c
        on c.tenant_id = a.tenant_id
       and c.branch_id = a.branch_id
       and c.id = a.client_id
      where a.tenant_id = ?
        and a.branch_id = ?
        and a.id = ?
      """,
      JdbcAppointmentEmailContextRepository::mapAppointmentEmailContext,
      tenantId,
      branchId,
      appointmentId
    ).stream().findFirst();
  }

  public List<ReminderCandidate> listReminderCandidates(
    Instant fromInclusive,
    Instant toInclusive
  ) {
    return jdbcTemplate.query(
      """
      select a.tenant_id,
             a.branch_id,
             a.id as appointment_id
      from appointments a
      join clients c
        on c.tenant_id = a.tenant_id
       and c.branch_id = a.branch_id
       and c.id = a.client_id
      where a.status = 'scheduled'
        and a.start_at >= ?
        and a.start_at <= ?
        and nullif(btrim(c.email), '') is not null
      order by a.start_at asc, a.id asc
      """,
      (resultSet, rowNum) -> new ReminderCandidate(
        resultSet.getObject("tenant_id", UUID.class),
        resultSet.getObject("branch_id", UUID.class),
        resultSet.getObject("appointment_id", UUID.class)
      ),
      Timestamp.from(fromInclusive),
      Timestamp.from(toInclusive)
    );
  }

  private static AppointmentEmailContext mapAppointmentEmailContext(ResultSet resultSet, int rowNum)
    throws SQLException {
    return new AppointmentEmailContext(
      resultSet.getObject("appointment_id", UUID.class),
      resultSet.getObject("branch_id", UUID.class),
      resultSet.getString("branch_name"),
      resultSet.getString("branch_code"),
      resultSet.getString("branch_time_zone"),
      resultSet.getTimestamp("start_at").toInstant(),
      resultSet.getTimestamp("end_at").toInstant(),
      resultSet.getString("barber_full_name"),
      resultSet.getString("service_name"),
      resultSet.getString("client_email"),
      resultSet.getString("client_full_name")
    );
  }

  public record AppointmentEmailContext(
    UUID appointmentId,
    UUID branchId,
    String branchName,
    String branchCode,
    String branchTimeZone,
    Instant startAt,
    Instant endAt,
    String barberFullName,
    String serviceName,
    String clientEmail,
    String clientFullName
  ) {
  }

  public record ReminderCandidate(UUID tenantId, UUID branchId, UUID appointmentId) {
  }
}

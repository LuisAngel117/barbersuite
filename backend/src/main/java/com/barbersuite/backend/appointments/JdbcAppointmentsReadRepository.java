package com.barbersuite.backend.appointments;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcAppointmentsReadRepository {

  private static final RowMapper<BusyRange> BUSY_RANGE_ROW_MAPPER =
    JdbcAppointmentsReadRepository::mapBusyRange;

  private final JdbcTemplate jdbcTemplate;

  public JdbcAppointmentsReadRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public List<BusyRange> listBusyRanges(
    UUID tenantId,
    UUID branchId,
    UUID barberId,
    Instant fromInclusive,
    Instant toExclusive
  ) {
    return jdbcTemplate.query(
      """
      select start_at, end_at
      from appointments
      where tenant_id = ?
        and branch_id = ?
        and barber_id = ?
        and status in ('scheduled', 'checked_in')
        and start_at < ?
        and end_at > ?
      order by start_at asc
      """,
      BUSY_RANGE_ROW_MAPPER,
      tenantId,
      branchId,
      barberId,
      Timestamp.from(toExclusive),
      Timestamp.from(fromInclusive)
    );
  }

  private static BusyRange mapBusyRange(ResultSet resultSet, int rowNum) throws SQLException {
    return new BusyRange(
      resultSet.getTimestamp("start_at").toInstant(),
      resultSet.getTimestamp("end_at").toInstant()
    );
  }

  public record BusyRange(Instant startAt, Instant endAt) {
  }
}

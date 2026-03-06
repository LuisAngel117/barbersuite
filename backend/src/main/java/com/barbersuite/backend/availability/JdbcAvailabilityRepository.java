package com.barbersuite.backend.availability;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Time;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcAvailabilityRepository {

  private static final RowMapper<WeeklyAvailabilityRow> WEEKLY_ROW_MAPPER =
    JdbcAvailabilityRepository::mapWeeklyRow;
  private static final RowMapper<AvailabilityExceptionRow> EXCEPTION_ROW_MAPPER =
    JdbcAvailabilityRepository::mapExceptionRow;
  private static final RowMapper<ExceptionIntervalRow> EXCEPTION_INTERVAL_ROW_MAPPER =
    JdbcAvailabilityRepository::mapExceptionIntervalRow;

  private final JdbcTemplate jdbcTemplate;

  public JdbcAvailabilityRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public List<WeeklyAvailabilityRow> listWeekly(
    UUID tenantId,
    UUID branchId,
    List<UUID> barberIds
  ) {
    if (barberIds.isEmpty()) {
      return List.of();
    }

    QueryParts queryParts = barberScopeQuery(
      """
      select barber_id, day_of_week, start_time, end_time
      from barber_weekly_availability
      where tenant_id = ?
        and branch_id = ?
      """,
      tenantId,
      branchId,
      barberIds
    );
    queryParts.sqlBuilder().append(
      """

      order by barber_id asc, day_of_week asc, start_time asc
      """
    );

    return jdbcTemplate.query(
      queryParts.sqlBuilder().toString(),
      WEEKLY_ROW_MAPPER,
      queryParts.arguments().toArray()
    );
  }

  public List<AvailabilityExceptionRow> listExceptions(
    UUID tenantId,
    UUID branchId,
    List<UUID> barberIds
  ) {
    if (barberIds.isEmpty()) {
      return List.of();
    }

    QueryParts queryParts = barberScopeQuery(
      """
      select id, barber_id, date, type, note
      from barber_availability_exceptions
      where tenant_id = ?
        and branch_id = ?
      """,
      tenantId,
      branchId,
      barberIds
    );
    queryParts.sqlBuilder().append(
      """

      order by barber_id asc, date asc, created_at asc
      """
    );

    return jdbcTemplate.query(
      queryParts.sqlBuilder().toString(),
      EXCEPTION_ROW_MAPPER,
      queryParts.arguments().toArray()
    );
  }

  public List<ExceptionIntervalRow> listExceptionIntervals(UUID tenantId, List<UUID> exceptionIds) {
    if (exceptionIds.isEmpty()) {
      return List.of();
    }

    String placeholders = String.join(", ", Collections.nCopies(exceptionIds.size(), "?"));
    List<Object> arguments = new ArrayList<>();
    arguments.add(tenantId);
    arguments.addAll(exceptionIds);

    return jdbcTemplate.query(
      """
      select exception_id, start_time, end_time
      from barber_exception_intervals
      where tenant_id = ?
        and exception_id in (%s)
      order by exception_id asc, start_time asc
      """.formatted(placeholders),
      EXCEPTION_INTERVAL_ROW_MAPPER,
      arguments.toArray()
    );
  }

  public void replaceWeekly(
    UUID tenantId,
    UUID branchId,
    UUID barberId,
    List<WeeklyAvailabilityInsert> weeklyIntervals
  ) {
    jdbcTemplate.update(
      """
      delete from barber_weekly_availability
      where tenant_id = ?
        and branch_id = ?
        and barber_id = ?
      """,
      tenantId,
      branchId,
      barberId
    );

    for (WeeklyAvailabilityInsert interval : weeklyIntervals) {
      jdbcTemplate.update(
        """
        insert into barber_weekly_availability (
          id,
          tenant_id,
          branch_id,
          barber_id,
          day_of_week,
          start_time,
          end_time,
          created_at,
          updated_at
        )
        values (?, ?, ?, ?, ?, ?, ?, now(), now())
        """,
        interval.id(),
        tenantId,
        branchId,
        barberId,
        interval.dayOfWeek(),
        Time.valueOf(interval.startTime()),
        Time.valueOf(interval.endTime())
      );
    }
  }

  public void replaceExceptions(
    UUID tenantId,
    UUID branchId,
    UUID barberId,
    List<AvailabilityExceptionInsert> exceptions,
    List<ExceptionIntervalInsert> exceptionIntervals
  ) {
    jdbcTemplate.update(
      """
      delete from barber_availability_exceptions
      where tenant_id = ?
        and branch_id = ?
        and barber_id = ?
      """,
      tenantId,
      branchId,
      barberId
    );

    for (AvailabilityExceptionInsert exception : exceptions) {
      jdbcTemplate.update(
        """
        insert into barber_availability_exceptions (
          id,
          tenant_id,
          branch_id,
          barber_id,
          date,
          type,
          note,
          created_at,
          updated_at
        )
        values (?, ?, ?, ?, ?, ?, ?, now(), now())
        """,
        exception.id(),
        tenantId,
        branchId,
        barberId,
        exception.date(),
        exception.type().name(),
        exception.note()
      );
    }

    for (ExceptionIntervalInsert interval : exceptionIntervals) {
      jdbcTemplate.update(
        """
        insert into barber_exception_intervals (
          id,
          tenant_id,
          exception_id,
          start_time,
          end_time,
          created_at
        )
        values (?, ?, ?, ?, ?, now())
        """,
        interval.id(),
        tenantId,
        interval.exceptionId(),
        Time.valueOf(interval.startTime()),
        Time.valueOf(interval.endTime())
      );
    }
  }

  private QueryParts barberScopeQuery(
    String baseSql,
    UUID tenantId,
    UUID branchId,
    List<UUID> barberIds
  ) {
    String placeholders = String.join(", ", Collections.nCopies(barberIds.size(), "?"));
    StringBuilder sqlBuilder = new StringBuilder(baseSql);
    sqlBuilder.append(" and barber_id in (").append(placeholders).append(')');

    List<Object> arguments = new ArrayList<>();
    arguments.add(tenantId);
    arguments.add(branchId);
    arguments.addAll(barberIds);
    return new QueryParts(sqlBuilder, arguments);
  }

  private static WeeklyAvailabilityRow mapWeeklyRow(ResultSet resultSet, int rowNum)
    throws SQLException {
    return new WeeklyAvailabilityRow(
      resultSet.getObject("barber_id", UUID.class),
      resultSet.getInt("day_of_week"),
      resultSet.getObject("start_time", LocalTime.class),
      resultSet.getObject("end_time", LocalTime.class)
    );
  }

  private static AvailabilityExceptionRow mapExceptionRow(ResultSet resultSet, int rowNum)
    throws SQLException {
    return new AvailabilityExceptionRow(
      resultSet.getObject("id", UUID.class),
      resultSet.getObject("barber_id", UUID.class),
      resultSet.getObject("date", LocalDate.class),
      AvailabilityExceptionType.parse(resultSet.getString("type")),
      resultSet.getString("note")
    );
  }

  private static ExceptionIntervalRow mapExceptionIntervalRow(ResultSet resultSet, int rowNum)
    throws SQLException {
    return new ExceptionIntervalRow(
      resultSet.getObject("exception_id", UUID.class),
      resultSet.getObject("start_time", LocalTime.class),
      resultSet.getObject("end_time", LocalTime.class)
    );
  }

  public record WeeklyAvailabilityRow(
    UUID barberId,
    int dayOfWeek,
    LocalTime startTime,
    LocalTime endTime
  ) {
  }

  public record AvailabilityExceptionRow(
    UUID id,
    UUID barberId,
    LocalDate date,
    AvailabilityExceptionType type,
    String note
  ) {
  }

  public record ExceptionIntervalRow(
    UUID exceptionId,
    LocalTime startTime,
    LocalTime endTime
  ) {
  }

  public record WeeklyAvailabilityInsert(
    UUID id,
    int dayOfWeek,
    LocalTime startTime,
    LocalTime endTime
  ) {
  }

  public record AvailabilityExceptionInsert(
    UUID id,
    LocalDate date,
    AvailabilityExceptionType type,
    String note
  ) {
  }

  public record ExceptionIntervalInsert(
    UUID id,
    UUID exceptionId,
    LocalTime startTime,
    LocalTime endTime
  ) {
  }

  private record QueryParts(StringBuilder sqlBuilder, List<Object> arguments) {
  }
}

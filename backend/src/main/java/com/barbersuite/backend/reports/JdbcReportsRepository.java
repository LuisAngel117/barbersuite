package com.barbersuite.backend.reports;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcReportsRepository {

  private static final RowMapper<SalesDailyRow> SALES_DAILY_ROW_MAPPER =
    JdbcReportsRepository::mapSalesDailyRow;
  private static final RowMapper<TopServiceRow> TOP_SERVICE_ROW_MAPPER =
    JdbcReportsRepository::mapTopServiceRow;
  private static final RowMapper<BarberSummaryRow> BARBER_SUMMARY_ROW_MAPPER =
    JdbcReportsRepository::mapBarberSummaryRow;

  private final JdbcTemplate jdbcTemplate;

  public JdbcReportsRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public SalesSummaryRow salesSummary(
    UUID tenantId,
    UUID branchId,
    Instant fromInclusive,
    Instant toExclusive
  ) {
    IssuedSalesAggregate issuedAggregate = jdbcTemplate.queryForObject(
      """
      select count(*)::int as receipts_count,
             coalesce(sum(total), 0) as gross_sales,
             coalesce(sum(tax), 0) as tax_total,
             coalesce(sum(discount), 0) as discount_total
      from receipts
      where tenant_id = ?
        and branch_id = ?
        and status = 'issued'
        and issued_at >= ?
        and issued_at < ?
      """,
      (resultSet, rowNum) -> new IssuedSalesAggregate(
        resultSet.getInt("receipts_count"),
        resultSet.getBigDecimal("gross_sales"),
        resultSet.getBigDecimal("tax_total"),
        resultSet.getBigDecimal("discount_total")
      ),
      tenantId,
      branchId,
      Timestamp.from(fromInclusive),
      Timestamp.from(toExclusive)
    );

    Integer voidedCount = jdbcTemplate.queryForObject(
      """
      select count(*)::int
      from receipts
      where tenant_id = ?
        and branch_id = ?
        and status = 'voided'
        and issued_at >= ?
        and issued_at < ?
      """,
      Integer.class,
      tenantId,
      branchId,
      Timestamp.from(fromInclusive),
      Timestamp.from(toExclusive)
    );

    return new SalesSummaryRow(
      issuedAggregate == null ? 0 : issuedAggregate.receiptsCount(),
      issuedAggregate == null ? BigDecimal.ZERO : issuedAggregate.grossSales(),
      voidedCount == null ? 0 : voidedCount,
      issuedAggregate == null ? BigDecimal.ZERO : issuedAggregate.taxTotal(),
      issuedAggregate == null ? BigDecimal.ZERO : issuedAggregate.discountTotal()
    );
  }

  public List<SalesDailyRow> salesDaily(
    UUID tenantId,
    UUID branchId,
    LocalDate fromDate,
    LocalDate toDate,
    String branchTimeZone
  ) {
    return jdbcTemplate.query(
      """
      with days as (
        select generate_series(?::date, ?::date, interval '1 day')::date as report_date
      )
      select days.report_date,
             coalesce(count(r.id) filter (where r.status = 'issued'), 0)::int as receipts_count,
             coalesce(sum(r.total) filter (where r.status = 'issued'), 0) as gross_sales,
             coalesce(sum(r.tax) filter (where r.status = 'issued'), 0) as tax_total,
             coalesce(sum(r.discount) filter (where r.status = 'issued'), 0) as discount_total
      from days
      left join receipts r
        on r.tenant_id = ?
       and r.branch_id = ?
       and (r.issued_at at time zone ?)::date = days.report_date
      group by days.report_date
      order by days.report_date asc
      """,
      SALES_DAILY_ROW_MAPPER,
      fromDate,
      toDate,
      tenantId,
      branchId,
      branchTimeZone
    );
  }

  public List<TopServiceRow> topServices(
    UUID tenantId,
    UUID branchId,
    Instant fromInclusive,
    Instant toExclusive,
    int limit
  ) {
    return jdbcTemplate.query(
      """
      select ri.service_id,
             s.name as service_name,
             coalesce(sum(ri.quantity), 0)::int as quantity,
             coalesce(sum(ri.line_total), 0) as revenue
      from receipt_items ri
      join receipts r
        on r.tenant_id = ri.tenant_id
       and r.id = ri.receipt_id
      join services s
        on s.tenant_id = ri.tenant_id
       and s.id = ri.service_id
      where ri.tenant_id = ?
        and r.branch_id = ?
        and r.status = 'issued'
        and ri.service_id is not null
        and r.issued_at >= ?
        and r.issued_at < ?
      group by ri.service_id, s.name
      order by revenue desc, quantity desc, s.name asc
      limit ?
      """,
      TOP_SERVICE_ROW_MAPPER,
      tenantId,
      branchId,
      Timestamp.from(fromInclusive),
      Timestamp.from(toExclusive),
      limit
    );
  }

  public AppointmentsSummaryRow appointmentsSummary(
    UUID tenantId,
    UUID branchId,
    Instant fromInclusive,
    Instant toExclusive
  ) {
    return jdbcTemplate.queryForObject(
      """
      select count(*) filter (where status = 'scheduled')::int as scheduled_count,
             count(*) filter (where status = 'checked_in')::int as checked_in_count,
             count(*) filter (where status = 'completed')::int as completed_count,
             count(*) filter (where status = 'cancelled')::int as cancelled_count,
             count(*) filter (where status = 'no_show')::int as no_show_count,
             coalesce(
               sum(extract(epoch from (end_at - start_at)) / 60)
                 filter (where status in ('scheduled', 'checked_in', 'completed')),
               0
             )::int as booked_minutes
      from appointments
      where tenant_id = ?
        and branch_id = ?
        and start_at >= ?
        and start_at < ?
      """,
      (resultSet, rowNum) -> new AppointmentsSummaryRow(
        resultSet.getInt("scheduled_count"),
        resultSet.getInt("checked_in_count"),
        resultSet.getInt("completed_count"),
        resultSet.getInt("cancelled_count"),
        resultSet.getInt("no_show_count"),
        resultSet.getInt("booked_minutes")
      ),
      tenantId,
      branchId,
      Timestamp.from(fromInclusive),
      Timestamp.from(toExclusive)
    );
  }

  public List<BarberSummaryRow> barbersSummary(
    UUID tenantId,
    UUID branchId,
    Instant fromInclusive,
    Instant toExclusive
  ) {
    return jdbcTemplate.query(
      """
      select a.barber_id,
             u.full_name as barber_name,
             count(*)::int as appointments_count,
             count(*) filter (where a.status = 'completed')::int as completed_count,
             count(*) filter (where a.status = 'no_show')::int as no_show_count,
             coalesce(
               sum(extract(epoch from (a.end_at - a.start_at)) / 60)
                 filter (where a.status in ('scheduled', 'checked_in', 'completed')),
               0
             )::int as booked_minutes
      from appointments a
      join users u
        on u.tenant_id = a.tenant_id
       and u.id = a.barber_id
      where a.tenant_id = ?
        and a.branch_id = ?
        and a.start_at >= ?
        and a.start_at < ?
      group by a.barber_id, u.full_name
      order by booked_minutes desc, appointments_count desc, barber_name asc
      """,
      BARBER_SUMMARY_ROW_MAPPER,
      tenantId,
      branchId,
      Timestamp.from(fromInclusive),
      Timestamp.from(toExclusive)
    );
  }

  private static SalesDailyRow mapSalesDailyRow(ResultSet resultSet, int rowNum) throws SQLException {
    return new SalesDailyRow(
      resultSet.getObject("report_date", LocalDate.class),
      resultSet.getInt("receipts_count"),
      resultSet.getBigDecimal("gross_sales"),
      resultSet.getBigDecimal("tax_total"),
      resultSet.getBigDecimal("discount_total")
    );
  }

  private static TopServiceRow mapTopServiceRow(ResultSet resultSet, int rowNum) throws SQLException {
    return new TopServiceRow(
      resultSet.getObject("service_id", UUID.class),
      resultSet.getString("service_name"),
      resultSet.getInt("quantity"),
      resultSet.getBigDecimal("revenue")
    );
  }

  private static BarberSummaryRow mapBarberSummaryRow(ResultSet resultSet, int rowNum)
    throws SQLException {
    return new BarberSummaryRow(
      resultSet.getObject("barber_id", UUID.class),
      resultSet.getString("barber_name"),
      resultSet.getInt("appointments_count"),
      resultSet.getInt("completed_count"),
      resultSet.getInt("no_show_count"),
      resultSet.getInt("booked_minutes")
    );
  }

  private record IssuedSalesAggregate(
    int receiptsCount,
    BigDecimal grossSales,
    BigDecimal taxTotal,
    BigDecimal discountTotal
  ) {
  }

  public record SalesSummaryRow(
    int receiptsCount,
    BigDecimal grossSales,
    int voidedCount,
    BigDecimal taxTotal,
    BigDecimal discountTotal
  ) {
  }

  public record SalesDailyRow(
    LocalDate date,
    int receiptsCount,
    BigDecimal grossSales,
    BigDecimal taxTotal,
    BigDecimal discountTotal
  ) {
  }

  public record TopServiceRow(
    UUID serviceId,
    String serviceName,
    int quantity,
    BigDecimal revenue
  ) {
  }

  public record AppointmentsSummaryRow(
    int scheduledCount,
    int checkedInCount,
    int completedCount,
    int cancelledCount,
    int noShowCount,
    int bookedMinutes
  ) {
  }

  public record BarberSummaryRow(
    UUID barberId,
    String barberName,
    int appointmentsCount,
    int completedCount,
    int noShowCount,
    int bookedMinutes
  ) {
  }
}

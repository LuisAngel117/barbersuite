package com.barbersuite.backend.reports;

import com.barbersuite.backend.branches.JdbcBranchInfoRepository;
import com.barbersuite.backend.context.BranchContext;
import com.barbersuite.backend.web.error.BranchNotFoundException;
import com.barbersuite.backend.web.error.ValidationErrorException;
import com.barbersuite.backend.web.reports.dto.AppointmentsSummaryResponse;
import com.barbersuite.backend.web.reports.dto.BarberSummaryItemResponse;
import com.barbersuite.backend.web.reports.dto.BarbersSummaryResponse;
import com.barbersuite.backend.web.reports.dto.SalesDailyItemResponse;
import com.barbersuite.backend.web.reports.dto.SalesDailyResponse;
import com.barbersuite.backend.web.reports.dto.SalesSummaryResponse;
import com.barbersuite.backend.web.reports.dto.TopServiceItemResponse;
import com.barbersuite.backend.web.reports.dto.TopServicesResponse;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportsService {

  private static final String USD = "USD";

  private final JdbcReportsRepository reportsRepository;
  private final JdbcBranchInfoRepository branchInfoRepository;

  public ReportsService(
    JdbcReportsRepository reportsRepository,
    JdbcBranchInfoRepository branchInfoRepository
  ) {
    this.reportsRepository = reportsRepository;
    this.branchInfoRepository = branchInfoRepository;
  }

  @Transactional(readOnly = true)
  public SalesSummaryResponse salesSummary(Jwt jwt, String from, String to) {
    ReportRange range = reportRange(jwt, from, to);
    JdbcReportsRepository.SalesSummaryRow summaryRow = reportsRepository.salesSummary(
      range.tenantId(),
      range.branchId(),
      range.fromInclusive(),
      range.toExclusive()
    );
    BigDecimal grossSales = money(summaryRow.grossSales());
    int receiptsCount = summaryRow.receiptsCount();
    BigDecimal avgTicket = receiptsCount == 0
      ? zeroMoney()
      : grossSales.divide(BigDecimal.valueOf(receiptsCount), 2, RoundingMode.HALF_UP);

    return new SalesSummaryResponse(
      range.fromDate(),
      range.toDate(),
      USD,
      receiptsCount,
      grossSales,
      summaryRow.voidedCount(),
      avgTicket,
      money(summaryRow.taxTotal()),
      money(summaryRow.discountTotal())
    );
  }

  @Transactional(readOnly = true)
  public SalesDailyResponse salesDaily(Jwt jwt, String from, String to) {
    ReportRange range = reportRange(jwt, from, to);
    List<SalesDailyItemResponse> items = reportsRepository.salesDaily(
      range.tenantId(),
      range.branchId(),
      range.fromDate(),
      range.toDate(),
      range.branchTimeZone()
    ).stream()
      .map(row -> new SalesDailyItemResponse(
        row.date(),
        row.receiptsCount(),
        money(row.grossSales()),
        money(row.taxTotal()),
        money(row.discountTotal())
      ))
      .toList();

    return new SalesDailyResponse(USD, items);
  }

  @Transactional(readOnly = true)
  public TopServicesResponse topServices(Jwt jwt, String from, String to, Integer limit) {
    ReportRange range = reportRange(jwt, from, to);
    int safeLimit = normalizeLimit(limit);

    List<TopServiceItemResponse> items = reportsRepository.topServices(
      range.tenantId(),
      range.branchId(),
      range.fromInclusive(),
      range.toExclusive(),
      safeLimit
    ).stream()
      .map(row -> new TopServiceItemResponse(
        row.serviceId(),
        row.serviceName(),
        row.quantity(),
        money(row.revenue())
      ))
      .toList();

    return new TopServicesResponse(USD, items);
  }

  @Transactional(readOnly = true)
  public AppointmentsSummaryResponse appointmentsSummary(Jwt jwt, String from, String to) {
    ReportRange range = reportRange(jwt, from, to);
    JdbcReportsRepository.AppointmentsSummaryRow summaryRow = reportsRepository.appointmentsSummary(
      range.tenantId(),
      range.branchId(),
      range.fromInclusive(),
      range.toExclusive()
    );

    return new AppointmentsSummaryResponse(
      range.fromDate(),
      range.toDate(),
      summaryRow.scheduledCount(),
      summaryRow.checkedInCount(),
      summaryRow.completedCount(),
      summaryRow.cancelledCount(),
      summaryRow.noShowCount(),
      summaryRow.bookedMinutes()
    );
  }

  @Transactional(readOnly = true)
  public BarbersSummaryResponse barbersSummary(Jwt jwt, String from, String to) {
    ReportRange range = reportRange(jwt, from, to);
    List<BarberSummaryItemResponse> items = reportsRepository.barbersSummary(
      range.tenantId(),
      range.branchId(),
      range.fromInclusive(),
      range.toExclusive()
    ).stream()
      .map(row -> new BarberSummaryItemResponse(
        row.barberId(),
        row.barberName(),
        row.appointmentsCount(),
        row.completedCount(),
        row.noShowCount(),
        row.bookedMinutes()
      ))
      .toList();

    return new BarbersSummaryResponse(items);
  }

  private ReportRange reportRange(Jwt jwt, String from, String to) {
    UUID tenantId = tenantId(jwt);
    UUID branchId = BranchContext.requireCurrentBranchId();
    String branchTimeZone = branchInfoRepository.findTimeZone(tenantId, branchId)
      .orElseThrow(BranchNotFoundException::new);
    ZoneId branchZoneId = branchZoneId(branchTimeZone);

    LocalDate fromDate = parseRequiredDate(from, "from");
    LocalDate toDate = parseRequiredDate(to, "to");
    if (fromDate.isAfter(toDate)) {
      throw new ValidationErrorException("from must be less than or equal to to.");
    }

    return new ReportRange(
      tenantId,
      branchId,
      branchTimeZone,
      branchZoneId,
      fromDate,
      toDate,
      fromDate.atStartOfDay(branchZoneId).toInstant(),
      toDate.plusDays(1).atStartOfDay(branchZoneId).toInstant()
    );
  }

  private int normalizeLimit(Integer limit) {
    int safeLimit = limit == null ? 10 : limit;
    if (safeLimit < 1 || safeLimit > 50) {
      throw new ValidationErrorException("limit must be between 1 and 50.");
    }
    return safeLimit;
  }

  private LocalDate parseRequiredDate(String rawValue, String fieldName) {
    if (rawValue == null || rawValue.isBlank()) {
      throw new ValidationErrorException(fieldName + " is required.");
    }

    try {
      return LocalDate.parse(rawValue.trim());
    } catch (DateTimeParseException exception) {
      throw new ValidationErrorException(fieldName + " must be a valid ISO date.");
    }
  }

  private ZoneId branchZoneId(String timeZone) {
    try {
      return ZoneId.of(timeZone);
    } catch (DateTimeException exception) {
      throw new IllegalStateException("Branch time zone is invalid: " + timeZone, exception);
    }
  }

  private BigDecimal money(BigDecimal value) {
    if (value == null) {
      return zeroMoney();
    }
    return value.setScale(2, RoundingMode.HALF_UP);
  }

  private BigDecimal zeroMoney() {
    return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
  }

  private UUID tenantId(Jwt jwt) {
    String claimValue = jwt.getClaimAsString("tenantId");
    if (claimValue == null || claimValue.isBlank()) {
      throw new IllegalStateException("Missing JWT claim: tenantId");
    }
    return UUID.fromString(claimValue);
  }

  private record ReportRange(
    UUID tenantId,
    UUID branchId,
    String branchTimeZone,
    ZoneId branchZoneId,
    LocalDate fromDate,
    LocalDate toDate,
    Instant fromInclusive,
    Instant toExclusive
  ) {
  }
}

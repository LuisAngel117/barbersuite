package com.barbersuite.backend.clients.history;

import com.barbersuite.backend.branches.JdbcBranchInfoRepository;
import com.barbersuite.backend.context.BranchContext;
import com.barbersuite.backend.web.clients.history.dto.ClientHistoryAppointment;
import com.barbersuite.backend.web.clients.history.dto.ClientHistoryClient;
import com.barbersuite.backend.web.clients.history.dto.ClientHistoryReceipt;
import com.barbersuite.backend.web.clients.history.dto.ClientHistoryResponse;
import com.barbersuite.backend.web.clients.history.dto.ClientHistoryStats;
import com.barbersuite.backend.web.error.BranchNotFoundException;
import com.barbersuite.backend.web.error.ClientNotFoundException;
import com.barbersuite.backend.web.error.ValidationErrorException;
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
public class ClientHistoryService {

  private static final int DEFAULT_LIMIT = 50;
  private static final int MAX_LIMIT = 200;

  private final JdbcClientHistoryRepository clientHistoryRepository;
  private final JdbcBranchInfoRepository branchInfoRepository;

  public ClientHistoryService(
    JdbcClientHistoryRepository clientHistoryRepository,
    JdbcBranchInfoRepository branchInfoRepository
  ) {
    this.clientHistoryRepository = clientHistoryRepository;
    this.branchInfoRepository = branchInfoRepository;
  }

  @Transactional(readOnly = true)
  public ClientHistoryResponse getHistory(
    Jwt jwt,
    UUID clientId,
    String from,
    String to,
    Integer limit
  ) {
    UUID tenantId = tenantId(jwt);
    UUID branchId = BranchContext.requireCurrentBranchId();
    ZoneId branchZoneId = branchZoneId(tenantId, branchId);
    int safeLimit = normalizeLimit(limit);
    HistoryRange historyRange = historyRange(from, to, branchZoneId);

    JdbcClientHistoryRepository.ClientRow clientRow = clientHistoryRepository.findClient(
      tenantId,
      branchId,
      clientId
    ).orElseThrow(ClientNotFoundException::new);

    List<ClientHistoryAppointment> appointments = clientHistoryRepository.listAppointments(
      tenantId,
      branchId,
      clientId,
      historyRange.fromInclusive(),
      historyRange.toExclusive(),
      safeLimit
    ).stream()
      .map(row -> new ClientHistoryAppointment(
        row.id(),
        row.status(),
        row.startAt(),
        row.endAt(),
        row.barberId(),
        row.barberName(),
        row.serviceId(),
        row.serviceName()
      ))
      .toList();

    List<ClientHistoryReceipt> receipts = clientHistoryRepository.listReceipts(
      tenantId,
      branchId,
      clientId,
      historyRange.fromInclusive(),
      historyRange.toExclusive(),
      safeLimit
    ).stream()
      .map(row -> new ClientHistoryReceipt(
        row.id(),
        row.number(),
        row.status(),
        row.issuedAt(),
        money(row.total())
      ))
      .toList();

    JdbcClientHistoryRepository.StatsRow statsRow = clientHistoryRepository.stats(
      tenantId,
      branchId,
      clientId,
      historyRange.fromInclusive(),
      historyRange.toExclusive()
    );

    return new ClientHistoryResponse(
      new ClientHistoryClient(
        clientRow.id(),
        clientRow.fullName(),
        clientRow.phone(),
        clientRow.email(),
        clientRow.notes(),
        clientRow.active(),
        clientRow.createdAt()
      ),
      appointments,
      receipts,
      new ClientHistoryStats(
        statsRow.totalVisits(),
        statsRow.noShows(),
        money(statsRow.totalSpend())
      )
    );
  }

  private int normalizeLimit(Integer limit) {
    int safeLimit = limit == null ? DEFAULT_LIMIT : limit;
    if (safeLimit < 1 || safeLimit > MAX_LIMIT) {
      throw new ValidationErrorException("limit must be between 1 and 200.");
    }
    return safeLimit;
  }

  private HistoryRange historyRange(String from, String to, ZoneId branchZoneId) {
    LocalDate fromDate = parseNullableDate(from, "from");
    LocalDate toDate = parseNullableDate(to, "to");
    if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
      throw new ValidationErrorException("from must be less than or equal to to.");
    }

    Instant fromInclusive = fromDate == null ? null : fromDate.atStartOfDay(branchZoneId).toInstant();
    Instant toExclusive = toDate == null ? null : toDate.plusDays(1).atStartOfDay(branchZoneId).toInstant();
    return new HistoryRange(fromInclusive, toExclusive);
  }

  private LocalDate parseNullableDate(String rawValue, String fieldName) {
    if (rawValue == null || rawValue.isBlank()) {
      return null;
    }

    try {
      return LocalDate.parse(rawValue.trim());
    } catch (DateTimeParseException exception) {
      throw new ValidationErrorException(fieldName + " must be a valid ISO date.");
    }
  }

  private ZoneId branchZoneId(UUID tenantId, UUID branchId) {
    String timeZone = branchInfoRepository.findTimeZone(tenantId, branchId)
      .orElseThrow(BranchNotFoundException::new);
    try {
      return ZoneId.of(timeZone);
    } catch (DateTimeException exception) {
      throw new IllegalStateException("Branch time zone is invalid: " + timeZone, exception);
    }
  }

  private BigDecimal money(BigDecimal value) {
    if (value == null) {
      return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    }
    return value.setScale(2, RoundingMode.HALF_UP);
  }

  private UUID tenantId(Jwt jwt) {
    String claimValue = jwt.getClaimAsString("tenantId");
    if (claimValue == null || claimValue.isBlank()) {
      throw new IllegalStateException("Missing JWT claim: tenantId");
    }
    return UUID.fromString(claimValue);
  }

  private record HistoryRange(Instant fromInclusive, Instant toExclusive) {
  }
}

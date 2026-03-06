package com.barbersuite.backend.cash;

import com.barbersuite.backend.appointments.JdbcAppointmentsRepository;
import com.barbersuite.backend.branches.JdbcBranchInfoRepository;
import com.barbersuite.backend.clients.JdbcClientsRepository;
import com.barbersuite.backend.context.BranchContext;
import com.barbersuite.backend.services.JdbcServiceRepository;
import com.barbersuite.backend.web.cash.dto.CreateReceiptItemRequest;
import com.barbersuite.backend.web.cash.dto.CreateReceiptPaymentRequest;
import com.barbersuite.backend.web.cash.dto.CreateReceiptRequest;
import com.barbersuite.backend.web.cash.dto.PaymentResponse;
import com.barbersuite.backend.web.cash.dto.ReceiptItemResponse;
import com.barbersuite.backend.web.cash.dto.ReceiptPageResponse;
import com.barbersuite.backend.web.cash.dto.ReceiptResponse;
import com.barbersuite.backend.web.cash.dto.VoidReceiptRequest;
import com.barbersuite.backend.web.error.AppointmentNotFoundException;
import com.barbersuite.backend.web.error.AppointmentReceiptConflictException;
import com.barbersuite.backend.web.error.BranchNotFoundException;
import com.barbersuite.backend.web.error.ClientNotFoundException;
import com.barbersuite.backend.web.error.ReceiptAlreadyVoidedException;
import com.barbersuite.backend.web.error.ReceiptConflictException;
import com.barbersuite.backend.web.error.ReceiptNotFoundException;
import com.barbersuite.backend.web.error.ServiceNotFoundException;
import com.barbersuite.backend.web.error.ValidationErrorException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.SQLException;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CashService {

  private static final String UNIQUE_VIOLATION_SQL_STATE = "23505";
  private static final String RECEIPT_NUMBER_UNIQUE_CONSTRAINT = "uq_receipts_tenant_branch_number";
  private static final String APPOINTMENT_RECEIPT_UNIQUE_INDEX =
    "ux_receipts_tenant_branch_appointment_issued";

  private final JdbcReceiptSequenceRepository receiptSequenceRepository;
  private final JdbcReceiptsRepository receiptsRepository;
  private final JdbcBranchInfoRepository branchInfoRepository;
  private final JdbcClientsRepository clientsRepository;
  private final JdbcAppointmentsRepository appointmentsRepository;
  private final JdbcServiceRepository serviceRepository;

  public CashService(
    JdbcReceiptSequenceRepository receiptSequenceRepository,
    JdbcReceiptsRepository receiptsRepository,
    JdbcBranchInfoRepository branchInfoRepository,
    JdbcClientsRepository clientsRepository,
    JdbcAppointmentsRepository appointmentsRepository,
    JdbcServiceRepository serviceRepository
  ) {
    this.receiptSequenceRepository = receiptSequenceRepository;
    this.receiptsRepository = receiptsRepository;
    this.branchInfoRepository = branchInfoRepository;
    this.clientsRepository = clientsRepository;
    this.appointmentsRepository = appointmentsRepository;
    this.serviceRepository = serviceRepository;
  }

  @Transactional(readOnly = true)
  public ReceiptPageResponse listReceipts(
    Jwt jwt,
    String from,
    String to,
    String status,
    String query,
    int page,
    int size
  ) {
    validatePagination(page, size);

    UUID tenantId = tenantId(jwt);
    UUID branchId = BranchContext.requireCurrentBranchId();
    ZoneId branchZoneId = branchZoneId(tenantId, branchId);

    JdbcReceiptsRepository.ReceiptFilter filter = new JdbcReceiptsRepository.ReceiptFilter(
      resolveFromInclusive(from, branchZoneId),
      resolveToExclusive(to, branchZoneId),
      parseOptionalStatus(status),
      normalizeNullable(query)
    );

    if (
      filter.fromInclusive() != null &&
      filter.toExclusive() != null &&
      !filter.fromInclusive().isBefore(filter.toExclusive())
    ) {
      throw new ValidationErrorException("from must be less than or equal to to.");
    }

    long totalItems = receiptsRepository.countReceipts(tenantId, branchId, filter);
    List<JdbcReceiptsRepository.ReceiptRow> rows = receiptsRepository.listReceipts(
      tenantId,
      branchId,
      filter,
      page,
      size
    );
    List<ReceiptResponse> items = toResponses(tenantId, rows);
    int totalPages = totalItems == 0 ? 0 : (int) Math.ceil((double) totalItems / size);
    return new ReceiptPageResponse(items, page, size, totalItems, totalPages);
  }

  @Transactional
  public ReceiptResponse createReceipt(Jwt jwt, CreateReceiptRequest request) {
    UUID tenantId = tenantId(jwt);
    UUID branchId = BranchContext.requireCurrentBranchId();
    JdbcBranchInfoRepository.BranchInfo branchInfo = branchInfoRepository.findBranchInfo(tenantId, branchId)
      .orElseThrow(BranchNotFoundException::new);
    ZoneId branchZoneId = branchZoneId(branchInfo.timeZone());

    validateReferences(tenantId, branchId, request);

    List<NormalizedReceiptItem> normalizedItems = normalizeItems(request.items());
    BigDecimal subtotal = subtotal(normalizedItems);
    BigDecimal discount = normalizeMoney(request.discount());
    BigDecimal tax = normalizeMoney(request.tax());
    BigDecimal total = computeTotal(subtotal, discount, tax);
    List<NormalizedReceiptPayment> normalizedPayments = normalizePayments(request.payments());

    validateDiscount(subtotal, discount);
    validatePaymentsTotal(total, normalizedPayments);

    Instant issuedAt = Instant.now();
    int year = issuedAt.atZone(branchZoneId).getYear();
    long sequence = receiptSequenceRepository.reserveNextNumber(tenantId, branchId, year);
    String number = "BR-%s-%d-%06d".formatted(branchInfo.code(), year, sequence);
    UUID receiptId = UUID.randomUUID();

    try {
      receiptsRepository.insertReceipt(
        tenantId,
        branchId,
        receiptId,
        number,
        ReceiptStatus.issued,
        request.clientId(),
        request.appointmentId(),
        issuedAt,
        subtotal,
        discount,
        tax,
        total,
        normalizeNullable(request.notes())
      );
      receiptsRepository.insertItems(
        tenantId,
        receiptId,
        normalizedItems.stream()
          .map(item -> new JdbcReceiptsRepository.ReceiptItemInsertRow(
            UUID.randomUUID(),
            item.serviceId(),
            item.description(),
            item.quantity(),
            item.unitPrice(),
            item.lineTotal()
          ))
          .toList()
      );
      receiptsRepository.insertPayments(
        tenantId,
        receiptId,
        normalizedPayments.stream()
          .map(payment -> new JdbcReceiptsRepository.ReceiptPaymentInsertRow(
            UUID.randomUUID(),
            payment.method(),
            payment.amount(),
            payment.reference()
          ))
          .toList()
      );
    } catch (DataIntegrityViolationException exception) {
      if (isAppointmentReceiptConflict(exception)) {
        throw new AppointmentReceiptConflictException();
      }
      if (isReceiptNumberConflict(exception)) {
        throw new ReceiptConflictException("Receipt number already exists for this branch.");
      }
      throw exception;
    }

    return getReceiptByTenantBranchAndId(tenantId, branchId, receiptId);
  }

  @Transactional(readOnly = true)
  public ReceiptResponse getReceipt(Jwt jwt, UUID receiptId) {
    return getReceiptByTenantBranchAndId(
      tenantId(jwt),
      BranchContext.requireCurrentBranchId(),
      receiptId
    );
  }

  @Transactional
  public ReceiptResponse voidReceipt(Jwt jwt, UUID receiptId, VoidReceiptRequest request) {
    UUID tenantId = tenantId(jwt);
    UUID branchId = BranchContext.requireCurrentBranchId();
    JdbcReceiptsRepository.ReceiptRow currentReceipt = receiptsRepository.findReceiptById(
      tenantId,
      branchId,
      receiptId
    ).orElseThrow(ReceiptNotFoundException::new);

    if (currentReceipt.status() == ReceiptStatus.voided) {
      throw new ReceiptAlreadyVoidedException();
    }

    int rowsUpdated = receiptsRepository.voidReceipt(
      tenantId,
      branchId,
      receiptId,
      normalizeVoidReason(request.reason()),
      Instant.now()
    );
    if (rowsUpdated == 0) {
      throw new ReceiptNotFoundException();
    }

    return getReceiptByTenantBranchAndId(tenantId, branchId, receiptId);
  }

  private ReceiptResponse getReceiptByTenantBranchAndId(UUID tenantId, UUID branchId, UUID receiptId) {
    JdbcReceiptsRepository.ReceiptRow row = receiptsRepository.findReceiptById(
      tenantId,
      branchId,
      receiptId
    ).orElseThrow(ReceiptNotFoundException::new);
    return toResponses(tenantId, List.of(row)).get(0);
  }

  private List<ReceiptResponse> toResponses(
    UUID tenantId,
    List<JdbcReceiptsRepository.ReceiptRow> rows
  ) {
    if (rows.isEmpty()) {
      return List.of();
    }

    List<UUID> receiptIds = rows.stream().map(JdbcReceiptsRepository.ReceiptRow::id).toList();
    Map<UUID, List<ReceiptItemResponse>> itemsByReceipt = groupItemsByReceipt(
      receiptsRepository.listItemsByReceiptIds(tenantId, receiptIds)
    );
    Map<UUID, List<PaymentResponse>> paymentsByReceipt = groupPaymentsByReceipt(
      receiptsRepository.listPaymentsByReceiptIds(tenantId, receiptIds)
    );

    return rows.stream()
      .map(row -> new ReceiptResponse(
        row.id(),
        row.number(),
        row.status(),
        row.clientId(),
        row.appointmentId(),
        row.issuedAt(),
        row.subtotal(),
        row.discount(),
        row.tax(),
        row.total(),
        row.notes(),
        itemsByReceipt.getOrDefault(row.id(), List.of()),
        paymentsByReceipt.getOrDefault(row.id(), List.of()),
        row.createdAt(),
        row.updatedAt()
      ))
      .toList();
  }

  private Map<UUID, List<ReceiptItemResponse>> groupItemsByReceipt(
    List<JdbcReceiptsRepository.ReceiptItemRow> itemRows
  ) {
    Map<UUID, List<ReceiptItemResponse>> itemsByReceipt = new LinkedHashMap<>();
    for (JdbcReceiptsRepository.ReceiptItemRow itemRow : itemRows) {
      itemsByReceipt.computeIfAbsent(itemRow.receiptId(), ignored -> new ArrayList<>())
        .add(new ReceiptItemResponse(
          itemRow.id(),
          itemRow.serviceId(),
          itemRow.description(),
          itemRow.quantity(),
          itemRow.unitPrice(),
          itemRow.lineTotal()
        ));
    }
    return itemsByReceipt;
  }

  private Map<UUID, List<PaymentResponse>> groupPaymentsByReceipt(
    List<JdbcReceiptsRepository.ReceiptPaymentRow> paymentRows
  ) {
    Map<UUID, List<PaymentResponse>> paymentsByReceipt = new LinkedHashMap<>();
    for (JdbcReceiptsRepository.ReceiptPaymentRow paymentRow : paymentRows) {
      paymentsByReceipt.computeIfAbsent(paymentRow.receiptId(), ignored -> new ArrayList<>())
        .add(new PaymentResponse(
          paymentRow.id(),
          paymentRow.method(),
          paymentRow.amount(),
          paymentRow.reference()
        ));
    }
    return paymentsByReceipt;
  }

  private void validateReferences(UUID tenantId, UUID branchId, CreateReceiptRequest request) {
    if (request.clientId() != null && !clientsRepository.existsById(tenantId, branchId, request.clientId())) {
      throw new ClientNotFoundException();
    }

    if (
      request.appointmentId() != null &&
      appointmentsRepository.findByTenantBranchAndId(tenantId, branchId, request.appointmentId())
        .isEmpty()
    ) {
      throw new AppointmentNotFoundException();
    }

    for (CreateReceiptItemRequest item : request.items()) {
      if (item.serviceId() != null && serviceRepository.findByTenantAndId(tenantId, item.serviceId()).isEmpty()) {
        throw new ServiceNotFoundException();
      }
    }
  }

  private List<NormalizedReceiptItem> normalizeItems(List<CreateReceiptItemRequest> items) {
    return items.stream()
      .map(item -> {
        BigDecimal unitPrice = normalizeMoney(item.unitPrice());
        BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(item.quantity()))
          .setScale(2, RoundingMode.HALF_UP);
        return new NormalizedReceiptItem(
          item.serviceId(),
          normalizeRequiredText(item.description(), "description"),
          item.quantity(),
          unitPrice,
          lineTotal
        );
      })
      .toList();
  }

  private List<NormalizedReceiptPayment> normalizePayments(List<CreateReceiptPaymentRequest> payments) {
    return payments.stream()
      .map(payment -> new NormalizedReceiptPayment(
        payment.method(),
        normalizePositiveMoney(payment.amount()),
        normalizeNullable(payment.reference())
      ))
      .toList();
  }

  private BigDecimal subtotal(List<NormalizedReceiptItem> items) {
    return items.stream()
      .map(NormalizedReceiptItem::lineTotal)
      .reduce(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP), BigDecimal::add)
      .setScale(2, RoundingMode.HALF_UP);
  }

  private BigDecimal computeTotal(BigDecimal subtotal, BigDecimal discount, BigDecimal tax) {
    BigDecimal total = subtotal.subtract(discount).add(tax).setScale(2, RoundingMode.HALF_UP);
    if (total.compareTo(BigDecimal.ZERO) < 0) {
      throw new ValidationErrorException("total must be greater than or equal to 0.");
    }
    return total;
  }

  private void validateDiscount(BigDecimal subtotal, BigDecimal discount) {
    if (discount.compareTo(subtotal) > 0) {
      throw new ValidationErrorException("discount must be less than or equal to subtotal.");
    }
  }

  private void validatePaymentsTotal(
    BigDecimal total,
    List<NormalizedReceiptPayment> payments
  ) {
    BigDecimal paymentsTotal = payments.stream()
      .map(NormalizedReceiptPayment::amount)
      .reduce(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP), BigDecimal::add)
      .setScale(2, RoundingMode.HALF_UP);

    if (paymentsTotal.compareTo(total) != 0) {
      throw new ValidationErrorException("payments total must equal receipt total.");
    }
  }

  private ReceiptStatus parseOptionalStatus(String rawValue) {
    String normalizedValue = normalizeNullable(rawValue);
    return normalizedValue == null ? null : ReceiptStatus.parse(normalizedValue);
  }

  private Instant resolveFromInclusive(String from, ZoneId branchZoneId) {
    LocalDate localDate = parseNullableDate(from, "from");
    if (localDate == null) {
      return null;
    }
    return localDate.atStartOfDay(branchZoneId).toInstant();
  }

  private Instant resolveToExclusive(String to, ZoneId branchZoneId) {
    LocalDate localDate = parseNullableDate(to, "to");
    if (localDate == null) {
      return null;
    }
    return localDate.plusDays(1).atStartOfDay(branchZoneId).toInstant();
  }

  private LocalDate parseNullableDate(String rawValue, String fieldName) {
    String normalizedValue = normalizeNullable(rawValue);
    if (normalizedValue == null) {
      return null;
    }

    try {
      return LocalDate.parse(normalizedValue);
    } catch (DateTimeParseException exception) {
      throw new ValidationErrorException(fieldName + " must be a valid ISO date.");
    }
  }

  private ZoneId branchZoneId(UUID tenantId, UUID branchId) {
    return branchInfoRepository.findTimeZone(tenantId, branchId)
      .map(this::branchZoneId)
      .orElseThrow(BranchNotFoundException::new);
  }

  private ZoneId branchZoneId(String timeZone) {
    try {
      return ZoneId.of(timeZone);
    } catch (DateTimeException exception) {
      throw new IllegalStateException("Branch time zone is invalid: " + timeZone, exception);
    }
  }

  private void validatePagination(int page, int size) {
    if (page < 0) {
      throw new ValidationErrorException("page must be greater than or equal to 0.");
    }
    if (size < 1) {
      throw new ValidationErrorException("size must be greater than or equal to 1.");
    }
  }

  private String normalizeRequiredText(String rawValue, String fieldName) {
    String normalizedValue = normalizeNullable(rawValue);
    if (normalizedValue == null) {
      throw new ValidationErrorException(fieldName + " is required.");
    }
    return normalizedValue;
  }

  private String normalizeVoidReason(String rawValue) {
    String normalizedReason = normalizeRequiredText(rawValue, "reason");
    if (normalizedReason.length() < 2) {
      throw new ValidationErrorException("reason must contain at least 2 characters.");
    }
    return normalizedReason;
  }

  private String normalizeNullable(String rawValue) {
    if (rawValue == null) {
      return null;
    }

    String normalizedValue = rawValue.trim();
    return normalizedValue.isEmpty() ? null : normalizedValue;
  }

  private BigDecimal normalizeMoney(BigDecimal rawValue) {
    if (rawValue == null) {
      return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    }
    return rawValue.setScale(2, RoundingMode.HALF_UP);
  }

  private BigDecimal normalizePositiveMoney(BigDecimal rawValue) {
    if (rawValue == null) {
      throw new ValidationErrorException("amount is required.");
    }

    BigDecimal normalizedValue = rawValue.setScale(2, RoundingMode.HALF_UP);
    if (normalizedValue.compareTo(BigDecimal.ZERO) <= 0) {
      throw new ValidationErrorException("amount must be greater than 0.");
    }
    return normalizedValue;
  }

  private boolean isAppointmentReceiptConflict(DataIntegrityViolationException exception) {
    Throwable cause = NestedExceptionUtils.getMostSpecificCause(exception);
    if (!(cause instanceof SQLException sqlException)) {
      return false;
    }

    return UNIQUE_VIOLATION_SQL_STATE.equals(sqlException.getSQLState()) &&
      sqlException.getMessage() != null &&
      sqlException.getMessage().contains(APPOINTMENT_RECEIPT_UNIQUE_INDEX);
  }

  private boolean isReceiptNumberConflict(DataIntegrityViolationException exception) {
    Throwable cause = NestedExceptionUtils.getMostSpecificCause(exception);
    if (!(cause instanceof SQLException sqlException)) {
      return false;
    }

    return UNIQUE_VIOLATION_SQL_STATE.equals(sqlException.getSQLState()) &&
      sqlException.getMessage() != null &&
      sqlException.getMessage().contains(RECEIPT_NUMBER_UNIQUE_CONSTRAINT);
  }

  private UUID tenantId(Jwt jwt) {
    String claimValue = jwt.getClaimAsString("tenantId");
    if (claimValue == null || claimValue.isBlank()) {
      throw new IllegalStateException("Missing JWT claim: tenantId");
    }
    return UUID.fromString(claimValue);
  }

  private record NormalizedReceiptItem(
    UUID serviceId,
    String description,
    int quantity,
    BigDecimal unitPrice,
    BigDecimal lineTotal
  ) {
  }

  private record NormalizedReceiptPayment(
    PaymentMethod method,
    BigDecimal amount,
    String reference
  ) {
  }
}

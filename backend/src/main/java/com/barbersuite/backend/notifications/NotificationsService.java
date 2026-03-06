package com.barbersuite.backend.notifications;

import com.barbersuite.backend.web.error.EmailOutboxDedupConflictException;
import com.barbersuite.backend.web.error.ValidationErrorException;
import com.barbersuite.backend.web.notifications.dto.EmailOutboxItemResponse;
import com.barbersuite.backend.web.notifications.dto.EmailOutboxPageResponse;
import com.barbersuite.backend.web.notifications.dto.SendTestEmailRequest;
import com.barbersuite.backend.web.notifications.dto.SendTestEmailResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationsService {

  private static final String UNIQUE_VIOLATION_SQL_STATE = "23505";
  private static final String EMAIL_OUTBOX_DEDUP_CONSTRAINT = "uq_email_outbox_tenant_dedup_key";

  private final JdbcEmailOutboxRepository emailOutboxRepository;

  public NotificationsService(JdbcEmailOutboxRepository emailOutboxRepository) {
    this.emailOutboxRepository = emailOutboxRepository;
  }

  @Transactional
  public SendTestEmailResponse enqueueTestEmail(Jwt jwt, SendTestEmailRequest request) {
    UUID tenantId = tenantId(jwt);
    String toEmail = normalizeEmail(request.toEmail());
    String subject = normalizeRequiredText(request.subject(), "subject");
    String bodyText = normalizeNullable(request.bodyText());
    String bodyHtml = normalizeNullable(request.bodyHtml());
    if (bodyText == null && bodyHtml == null) {
      throw new ValidationErrorException("At least one of bodyText or bodyHtml is required.");
    }

    UUID outboxId = UUID.randomUUID();
    Instant scheduledAt = Instant.now();
    String dedupKey = dedupKey(toEmail, subject, bodyText, bodyHtml);

    try {
      emailOutboxRepository.insertOutbox(
        tenantId,
        outboxId,
        EmailKind.appointment_confirmation,
        EmailOutboxStatus.pending,
        toEmail,
        subject,
        bodyText,
        bodyHtml,
        dedupKey,
        scheduledAt
      );
    } catch (DataIntegrityViolationException exception) {
      if (isDedupConflict(exception)) {
        throw new EmailOutboxDedupConflictException();
      }
      throw exception;
    }

    return new SendTestEmailResponse(outboxId, EmailOutboxStatus.pending);
  }

  @Transactional(readOnly = true)
  public EmailOutboxPageResponse listOutbox(
    Jwt jwt,
    String status,
    String kind,
    String from,
    String to,
    int page,
    int size
  ) {
    validatePagination(page, size);
    LocalDate fromDate = parseOptionalDate(from, "from");
    LocalDate toDate = parseOptionalDate(to, "to");
    if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
      throw new ValidationErrorException("from must be less than or equal to to.");
    }

    JdbcEmailOutboxRepository.EmailOutboxFilter filter =
      new JdbcEmailOutboxRepository.EmailOutboxFilter(
        parsePublicStatuses(status),
        parseOptionalKind(kind),
        fromDate == null ? null : fromDate.atStartOfDay(ZoneOffset.UTC).toInstant(),
        toDate == null ? null : toDate.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant()
      );

    UUID tenantId = tenantId(jwt);
    long totalItems = emailOutboxRepository.countOutbox(tenantId, filter);
    List<EmailOutboxItemResponse> items = emailOutboxRepository.listOutbox(
      tenantId,
      filter,
      page,
      size
    ).stream()
      .map(row -> new EmailOutboxItemResponse(
        row.id(),
        row.kind(),
        publicStatus(row.status()),
        row.toEmail(),
        row.subject(),
        row.scheduledAt(),
        row.sentAt(),
        row.attempts(),
        row.lastError(),
        row.createdAt()
      ))
      .toList();

    int totalPages = totalItems == 0 ? 0 : (int) Math.ceil((double) totalItems / size);
    return new EmailOutboxPageResponse(items, page, size, totalItems, totalPages);
  }

  private UUID tenantId(Jwt jwt) {
    String claimValue = jwt.getClaimAsString("tenantId");
    if (claimValue == null || claimValue.isBlank()) {
      throw new IllegalStateException("Missing JWT claim: tenantId");
    }
    return UUID.fromString(claimValue);
  }

  private String normalizeEmail(String rawEmail) {
    String normalizedEmail = normalizeRequiredText(rawEmail, "toEmail");
    return normalizedEmail.toLowerCase(Locale.ROOT);
  }

  private String normalizeRequiredText(String rawValue, String fieldName) {
    String normalizedValue = normalizeNullable(rawValue);
    if (normalizedValue == null) {
      throw new ValidationErrorException(fieldName + " is required.");
    }
    return normalizedValue;
  }

  private String normalizeNullable(String rawValue) {
    if (rawValue == null) {
      return null;
    }
    String normalizedValue = rawValue.trim();
    return normalizedValue.isEmpty() ? null : normalizedValue;
  }

  private void validatePagination(int page, int size) {
    if (page < 0) {
      throw new ValidationErrorException("page must be greater than or equal to 0.");
    }
    if (size < 1) {
      throw new ValidationErrorException("size must be greater than or equal to 1.");
    }
  }

  private LocalDate parseOptionalDate(String rawValue, String fieldName) {
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

  private EmailOutboxStatus parseOptionalStatus(String rawValue) {
    String normalizedValue = normalizeNullable(rawValue);
    return normalizedValue == null ? null : EmailOutboxStatus.parse(normalizedValue);
  }

  private List<EmailOutboxStatus> parsePublicStatuses(String rawValue) {
    EmailOutboxStatus status = parseOptionalStatus(rawValue);
    if (status == null) {
      return List.of();
    }
    if (status == EmailOutboxStatus.processing) {
      throw new ValidationErrorException("status must be a valid public email outbox status.");
    }
    if (status == EmailOutboxStatus.pending) {
      List<EmailOutboxStatus> statuses = new ArrayList<>();
      statuses.add(EmailOutboxStatus.pending);
      statuses.add(EmailOutboxStatus.processing);
      return List.copyOf(statuses);
    }
    return List.of(status);
  }

  private EmailKind parseOptionalKind(String rawValue) {
    String normalizedValue = normalizeNullable(rawValue);
    return normalizedValue == null ? null : EmailKind.parse(normalizedValue);
  }

  private EmailOutboxStatus publicStatus(EmailOutboxStatus status) {
    return status == EmailOutboxStatus.processing ? EmailOutboxStatus.pending : status;
  }

  private String dedupKey(
    String toEmail,
    String subject,
    String bodyText,
    String bodyHtml
  ) {
    try {
      MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
      messageDigest.update(toEmail.getBytes(StandardCharsets.UTF_8));
      messageDigest.update((byte) '\n');
      messageDigest.update(subject.getBytes(StandardCharsets.UTF_8));
      messageDigest.update((byte) '\n');
      messageDigest.update((bodyText == null ? "" : bodyText).getBytes(StandardCharsets.UTF_8));
      messageDigest.update((byte) '\n');
      messageDigest.update((bodyHtml == null ? "" : bodyHtml).getBytes(StandardCharsets.UTF_8));
      return "test:" + HexFormat.of().formatHex(messageDigest.digest());
    } catch (NoSuchAlgorithmException exception) {
      throw new IllegalStateException("SHA-256 is not available.", exception);
    }
  }

  private boolean isDedupConflict(DataIntegrityViolationException exception) {
    Throwable cause = NestedExceptionUtils.getMostSpecificCause(exception);
    if (!(cause instanceof SQLException sqlException)) {
      return false;
    }

    return UNIQUE_VIOLATION_SQL_STATE.equals(sqlException.getSQLState()) &&
      sqlException.getMessage() != null &&
      sqlException.getMessage().contains(EMAIL_OUTBOX_DEDUP_CONSTRAINT);
  }
}

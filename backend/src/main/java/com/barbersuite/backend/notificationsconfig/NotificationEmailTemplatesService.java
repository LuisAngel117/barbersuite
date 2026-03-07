package com.barbersuite.backend.notificationsconfig;

import com.barbersuite.backend.notifications.EmailKind;
import com.barbersuite.backend.web.error.ValidationErrorException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationEmailTemplatesService {

  private static final Instant FALLBACK_UPDATED_AT = Instant.EPOCH;

  private final JdbcNotificationEmailTemplatesRepository notificationEmailTemplatesRepository;
  private final NotificationEmailTemplateDefaults notificationEmailTemplateDefaults;

  public NotificationEmailTemplatesService(
    JdbcNotificationEmailTemplatesRepository notificationEmailTemplatesRepository,
    NotificationEmailTemplateDefaults notificationEmailTemplateDefaults
  ) {
    this.notificationEmailTemplatesRepository = notificationEmailTemplatesRepository;
    this.notificationEmailTemplateDefaults = notificationEmailTemplateDefaults;
  }

  @Transactional(readOnly = true)
  public List<EffectiveNotificationEmailTemplate> listEffectiveTemplates(UUID tenantId) {
    Map<EmailKind, JdbcNotificationEmailTemplatesRepository.NotificationEmailTemplateRow> rowsByKind =
      new LinkedHashMap<>();
    notificationEmailTemplatesRepository.findAllByTenant(tenantId)
      .forEach(row -> rowsByKind.put(row.kind(), row));

    return notificationEmailTemplateDefaults.supportedKinds().stream()
      .map(kind -> resolveEffectiveTemplate(tenantId, kind, rowsByKind.get(kind)))
      .toList();
  }

  @Transactional(readOnly = true)
  public EffectiveNotificationEmailTemplate resolveEffectiveTemplate(UUID tenantId, EmailKind kind) {
    return resolveEffectiveTemplate(
      tenantId,
      kind,
      notificationEmailTemplatesRepository.findByTenantAndKind(tenantId, kind).orElse(null)
    );
  }

  @Transactional
  public EffectiveNotificationEmailTemplate upsertTemplate(
    UUID tenantId,
    EmailKind kind,
    boolean enabled,
    String subjectTemplate,
    String bodyTextTemplate,
    String bodyHtmlTemplate
  ) {
    String normalizedSubjectTemplate = normalizeSubjectTemplate(subjectTemplate);
    String normalizedBodyTextTemplate = normalizeNullable(bodyTextTemplate);
    String normalizedBodyHtmlTemplate = normalizeNullable(bodyHtmlTemplate);
    if (normalizedBodyTextTemplate == null && normalizedBodyHtmlTemplate == null) {
      throw new ValidationErrorException(
        "At least one of bodyTextTemplate or bodyHtmlTemplate is required."
      );
    }

    JdbcNotificationEmailTemplatesRepository.NotificationEmailTemplateRow row =
      notificationEmailTemplatesRepository.upsert(
        tenantId,
        UUID.randomUUID(),
        kind,
        enabled,
        normalizedSubjectTemplate,
        normalizedBodyTextTemplate,
        normalizedBodyHtmlTemplate
      );

    return mapRow(row);
  }

  private EffectiveNotificationEmailTemplate resolveEffectiveTemplate(
    UUID tenantId,
    EmailKind kind,
    JdbcNotificationEmailTemplatesRepository.NotificationEmailTemplateRow row
  ) {
    if (row != null) {
      return mapRow(row);
    }

    NotificationEmailTemplateDefaults.TemplateDefinition defaults =
      notificationEmailTemplateDefaults.templateFor(kind);
    return new EffectiveNotificationEmailTemplate(
      fallbackId(tenantId, kind),
      kind,
      defaults.enabled(),
      defaults.subjectTemplate(),
      defaults.bodyTextTemplate(),
      defaults.bodyHtmlTemplate(),
      FALLBACK_UPDATED_AT
    );
  }

  private EffectiveNotificationEmailTemplate mapRow(
    JdbcNotificationEmailTemplatesRepository.NotificationEmailTemplateRow row
  ) {
    return new EffectiveNotificationEmailTemplate(
      row.id(),
      row.kind(),
      row.enabled(),
      row.subjectTemplate(),
      row.bodyTextTemplate(),
      row.bodyHtmlTemplate(),
      row.updatedAt()
    );
  }

  private UUID fallbackId(UUID tenantId, EmailKind kind) {
    return UUID.nameUUIDFromBytes(
      ("notification-template:" + tenantId + ":" + kind.name()).getBytes(StandardCharsets.UTF_8)
    );
  }

  private String normalizeSubjectTemplate(String subjectTemplate) {
    String normalizedSubjectTemplate = normalizeNullable(subjectTemplate);
    if (normalizedSubjectTemplate == null || normalizedSubjectTemplate.length() < 2) {
      throw new ValidationErrorException("subjectTemplate must contain at least 2 characters.");
    }
    return normalizedSubjectTemplate;
  }

  private String normalizeNullable(String rawValue) {
    if (rawValue == null) {
      return null;
    }
    String normalizedValue = rawValue.trim();
    return normalizedValue.isEmpty() ? null : normalizedValue;
  }

  public record EffectiveNotificationEmailTemplate(
    UUID id,
    EmailKind kind,
    boolean enabled,
    String subjectTemplate,
    String bodyTextTemplate,
    String bodyHtmlTemplate,
    Instant updatedAt
  ) {
  }
}

package com.barbersuite.backend.notificationsconfig;

import com.barbersuite.backend.notifications.EmailKind;
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
public class JdbcNotificationEmailTemplatesRepository {

  private final JdbcTemplate jdbcTemplate;

  public JdbcNotificationEmailTemplatesRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public List<NotificationEmailTemplateRow> findAllByTenant(UUID tenantId) {
    return jdbcTemplate.query(
      """
      select id,
             tenant_id,
             kind,
             enabled,
             subject_template,
             body_text_template,
             body_html_template,
             created_at,
             updated_at
      from notification_email_templates
      where tenant_id = ?
      order by kind asc
      """,
      JdbcNotificationEmailTemplatesRepository::mapRow,
      tenantId
    );
  }

  public Optional<NotificationEmailTemplateRow> findByTenantAndKind(UUID tenantId, EmailKind kind) {
    return jdbcTemplate.query(
      """
      select id,
             tenant_id,
             kind,
             enabled,
             subject_template,
             body_text_template,
             body_html_template,
             created_at,
             updated_at
      from notification_email_templates
      where tenant_id = ?
        and kind = ?
      """,
      JdbcNotificationEmailTemplatesRepository::mapRow,
      tenantId,
      kind.name()
    ).stream().findFirst();
  }

  public NotificationEmailTemplateRow upsert(
    UUID tenantId,
    UUID templateId,
    EmailKind kind,
    boolean enabled,
    String subjectTemplate,
    String bodyTextTemplate,
    String bodyHtmlTemplate
  ) {
    return jdbcTemplate.queryForObject(
      """
      insert into notification_email_templates (
        id,
        tenant_id,
        kind,
        enabled,
        subject_template,
        body_text_template,
        body_html_template,
        created_at,
        updated_at
      )
      values (?, ?, ?, ?, ?, ?, ?, now(), now())
      on conflict (tenant_id, kind) do update
        set enabled = excluded.enabled,
            subject_template = excluded.subject_template,
            body_text_template = excluded.body_text_template,
            body_html_template = excluded.body_html_template,
            updated_at = now()
      returning id,
                tenant_id,
                kind,
                enabled,
                subject_template,
                body_text_template,
                body_html_template,
                created_at,
                updated_at
      """,
      JdbcNotificationEmailTemplatesRepository::mapRow,
      templateId,
      tenantId,
      kind.name(),
      enabled,
      subjectTemplate,
      bodyTextTemplate,
      bodyHtmlTemplate
    );
  }

  private static NotificationEmailTemplateRow mapRow(ResultSet resultSet, int rowNum)
    throws SQLException {
    return new NotificationEmailTemplateRow(
      resultSet.getObject("id", UUID.class),
      resultSet.getObject("tenant_id", UUID.class),
      EmailKind.parse(resultSet.getString("kind")),
      resultSet.getBoolean("enabled"),
      resultSet.getString("subject_template"),
      resultSet.getString("body_text_template"),
      resultSet.getString("body_html_template"),
      resultSet.getTimestamp("created_at").toInstant(),
      resultSet.getTimestamp("updated_at").toInstant()
    );
  }

  public record NotificationEmailTemplateRow(
    UUID id,
    UUID tenantId,
    EmailKind kind,
    boolean enabled,
    String subjectTemplate,
    String bodyTextTemplate,
    String bodyHtmlTemplate,
    Instant createdAt,
    Instant updatedAt
  ) {
  }
}

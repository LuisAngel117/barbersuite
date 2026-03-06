package com.barbersuite.backend.notifications;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcEmailOutboxRepository {

  private static final RowMapper<EmailOutboxRow> EMAIL_OUTBOX_ROW_MAPPER =
    JdbcEmailOutboxRepository::mapEmailOutboxRow;

  private final JdbcTemplate jdbcTemplate;

  public JdbcEmailOutboxRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public void insertOutbox(
    UUID tenantId,
    UUID outboxId,
    EmailKind kind,
    EmailOutboxStatus status,
    String toEmail,
    String subject,
    String bodyText,
    String bodyHtml,
    String dedupKey,
    Instant scheduledAt
  ) {
    jdbcTemplate.update(
      """
      insert into email_outbox (
        id,
        tenant_id,
        branch_id,
        kind,
        status,
        to_email,
        subject,
        body_text,
        body_html,
        dedup_key,
        appointment_id,
        attempts,
        last_error,
        scheduled_at,
        sent_at,
        created_at,
        updated_at
      )
      values (?, ?, null, ?, ?, ?, ?, ?, ?, ?, null, 0, null, ?, null, now(), now())
      """,
      outboxId,
      tenantId,
      kind.name(),
      status.name(),
      toEmail,
      subject,
      bodyText,
      bodyHtml,
      dedupKey,
      Timestamp.from(scheduledAt)
    );
  }

  public boolean insertOutboxIgnoringDedup(
    UUID tenantId,
    UUID branchId,
    UUID outboxId,
    EmailKind kind,
    EmailOutboxStatus status,
    String toEmail,
    String subject,
    String bodyText,
    String bodyHtml,
    String dedupKey,
    UUID appointmentId,
    Instant scheduledAt
  ) {
    return jdbcTemplate.update(
      """
      insert into email_outbox (
        id,
        tenant_id,
        branch_id,
        kind,
        status,
        to_email,
        subject,
        body_text,
        body_html,
        dedup_key,
        appointment_id,
        attempts,
        last_error,
        scheduled_at,
        sent_at,
        created_at,
        updated_at
      )
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, null, ?, null, now(), now())
      on conflict (tenant_id, dedup_key) do nothing
      """,
      outboxId,
      tenantId,
      branchId,
      kind.name(),
      status.name(),
      toEmail,
      subject,
      bodyText,
      bodyHtml,
      dedupKey,
      appointmentId,
      Timestamp.from(scheduledAt)
    ) > 0;
  }

  public List<EmailOutboxRow> listOutbox(UUID tenantId, EmailOutboxFilter filter, int page, int size) {
    QueryParts queryParts = queryParts(
      """
      select id,
             kind,
             status,
             to_email,
             subject,
             scheduled_at,
             sent_at,
             attempts,
             last_error,
             created_at
      from email_outbox
      where tenant_id = ?
      """,
      tenantId,
      filter
    );
    queryParts.sqlBuilder().append(
      """

      order by created_at desc, id desc
      limit ?
      offset ?
      """
    );
    queryParts.arguments().add(size);
    queryParts.arguments().add((long) page * size);

    return jdbcTemplate.query(
      queryParts.sqlBuilder().toString(),
      EMAIL_OUTBOX_ROW_MAPPER,
      queryParts.arguments().toArray()
    );
  }

  public long countOutbox(UUID tenantId, EmailOutboxFilter filter) {
    QueryParts queryParts = queryParts(
      """
      select count(*)
      from email_outbox
      where tenant_id = ?
      """,
      tenantId,
      filter
    );

    Long count = jdbcTemplate.queryForObject(
      queryParts.sqlBuilder().toString(),
      Long.class,
      queryParts.arguments().toArray()
    );
    return count == null ? 0L : count;
  }

  private QueryParts queryParts(String baseSql, UUID tenantId, EmailOutboxFilter filter) {
    StringBuilder sqlBuilder = new StringBuilder(baseSql);
    List<Object> arguments = new ArrayList<>();
    arguments.add(tenantId);

    if (!filter.statuses().isEmpty()) {
      String placeholders = String.join(", ", Collections.nCopies(filter.statuses().size(), "?"));
      sqlBuilder.append(" and status in (" + placeholders + ")");
      filter.statuses().forEach(status -> arguments.add(status.name()));
    }
    if (filter.kind() != null) {
      sqlBuilder.append(" and kind = ?");
      arguments.add(filter.kind().name());
    }
    if (filter.fromInclusive() != null) {
      sqlBuilder.append(" and created_at >= ?");
      arguments.add(Timestamp.from(filter.fromInclusive()));
    }
    if (filter.toExclusive() != null) {
      sqlBuilder.append(" and created_at < ?");
      arguments.add(Timestamp.from(filter.toExclusive()));
    }

    return new QueryParts(sqlBuilder, arguments);
  }

  private static EmailOutboxRow mapEmailOutboxRow(ResultSet resultSet, int rowNum) throws SQLException {
    return new EmailOutboxRow(
      resultSet.getObject("id", UUID.class),
      EmailKind.parse(resultSet.getString("kind")),
      EmailOutboxStatus.parse(resultSet.getString("status")),
      resultSet.getString("to_email"),
      resultSet.getString("subject"),
      resultSet.getTimestamp("scheduled_at").toInstant(),
      toInstantOrNull(resultSet.getTimestamp("sent_at")),
      resultSet.getInt("attempts"),
      resultSet.getString("last_error"),
      resultSet.getTimestamp("created_at").toInstant()
    );
  }

  private static Instant toInstantOrNull(Timestamp timestamp) {
    return timestamp == null ? null : timestamp.toInstant();
  }

  public record EmailOutboxRow(
    UUID id,
    EmailKind kind,
    EmailOutboxStatus status,
    String toEmail,
    String subject,
    Instant scheduledAt,
    Instant sentAt,
    int attempts,
    String lastError,
    Instant createdAt
  ) {
  }

  public record EmailOutboxFilter(
    List<EmailOutboxStatus> statuses,
    EmailKind kind,
    Instant fromInclusive,
    Instant toExclusive
  ) {
  }

  private record QueryParts(StringBuilder sqlBuilder, List<Object> arguments) {
  }
}

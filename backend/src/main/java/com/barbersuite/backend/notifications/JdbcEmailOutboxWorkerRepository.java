package com.barbersuite.backend.notifications;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class JdbcEmailOutboxWorkerRepository {

  private static final RowMapper<ClaimedEmailOutboxRow> CLAIMED_OUTBOX_ROW_MAPPER =
    JdbcEmailOutboxWorkerRepository::mapClaimedOutboxRow;

  private final JdbcTemplate jdbcTemplate;

  public JdbcEmailOutboxWorkerRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  @Transactional
  public List<ClaimedEmailOutboxRow> claimBatch(Instant now, int limit) {
    return jdbcTemplate.query(
      """
      with claimed as (
        select id
        from email_outbox
        where status = 'pending'
          and scheduled_at <= ?
        order by scheduled_at asc, created_at asc
        for update skip locked
        limit ?
      )
      update email_outbox outbox
      set status = 'processing',
          processing_started_at = now(),
          updated_at = now()
      from claimed
      where outbox.id = claimed.id
      returning outbox.id,
                outbox.tenant_id,
                outbox.kind,
                outbox.to_email,
                outbox.subject,
                outbox.body_text,
                outbox.body_html,
                outbox.attempts
      """,
      CLAIMED_OUTBOX_ROW_MAPPER,
      Timestamp.from(now),
      limit
    );
  }

  @Transactional
  public boolean markSent(UUID outboxId) {
    return jdbcTemplate.update(
      """
      update email_outbox
      set status = 'sent',
          sent_at = now(),
          last_error = null,
          processing_started_at = null,
          updated_at = now()
      where id = ?
        and status = 'processing'
      """,
      outboxId
    ) == 1;
  }

  @Transactional
  public boolean markPendingRetry(UUID outboxId, String lastError, Instant scheduledAt) {
    return jdbcTemplate.update(
      """
      update email_outbox
      set status = 'pending',
          attempts = attempts + 1,
          last_error = ?,
          scheduled_at = ?,
          processing_started_at = null,
          updated_at = now()
      where id = ?
        and status = 'processing'
      """,
      lastError,
      Timestamp.from(scheduledAt),
      outboxId
    ) == 1;
  }

  @Transactional
  public boolean markFailed(UUID outboxId, String lastError) {
    return jdbcTemplate.update(
      """
      update email_outbox
      set status = 'failed',
          attempts = attempts + 1,
          last_error = ?,
          processing_started_at = null,
          updated_at = now()
      where id = ?
        and status = 'processing'
      """,
      lastError,
      outboxId
    ) == 1;
  }

  private static ClaimedEmailOutboxRow mapClaimedOutboxRow(ResultSet resultSet, int rowNum)
    throws SQLException {
    return new ClaimedEmailOutboxRow(
      resultSet.getObject("id", UUID.class),
      resultSet.getObject("tenant_id", UUID.class),
      EmailKind.parse(resultSet.getString("kind")),
      resultSet.getString("to_email"),
      resultSet.getString("subject"),
      resultSet.getString("body_text"),
      resultSet.getString("body_html"),
      resultSet.getInt("attempts")
    );
  }

  public record ClaimedEmailOutboxRow(
    UUID id,
    UUID tenantId,
    EmailKind kind,
    String toEmail,
    String subject,
    String bodyText,
    String bodyHtml,
    int attempts
  ) {
  }
}

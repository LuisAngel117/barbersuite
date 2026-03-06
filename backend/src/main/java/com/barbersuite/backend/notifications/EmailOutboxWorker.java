package com.barbersuite.backend.notifications;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class EmailOutboxWorker {

  private static final Logger log = LoggerFactory.getLogger(EmailOutboxWorker.class);

  private final JdbcEmailOutboxWorkerRepository emailOutboxWorkerRepository;
  private final EmailSender emailSender;
  private final boolean workerEnabled;
  private final int batchSize;
  private final int maxAttempts;
  private final Duration baseBackoff;
  private final Duration maxBackoff;

  public EmailOutboxWorker(
    JdbcEmailOutboxWorkerRepository emailOutboxWorkerRepository,
    EmailSender emailSender,
    @Value("${notifications.email.worker.enabled:true}") boolean workerEnabled,
    @Value("${notifications.email.worker.batch-size:20}") int batchSize,
    @Value("${notifications.email.worker.max-attempts:5}") int maxAttempts,
    @Value("${notifications.email.worker.base-backoff:PT30S}") Duration baseBackoff,
    @Value("${notifications.email.worker.max-backoff:PT15M}") Duration maxBackoff
  ) {
    this.emailOutboxWorkerRepository = emailOutboxWorkerRepository;
    this.emailSender = emailSender;
    this.workerEnabled = workerEnabled;
    this.batchSize = batchSize;
    this.maxAttempts = maxAttempts;
    this.baseBackoff = baseBackoff;
    this.maxBackoff = maxBackoff;
  }

  @Scheduled(fixedDelayString = "${notifications.email.worker.delay:2000}")
  public void scheduledProcess() {
    if (!workerEnabled) {
      return;
    }
    processOnce();
  }

  public int processOnce() {
    Instant now = Instant.now();
    List<JdbcEmailOutboxWorkerRepository.ClaimedEmailOutboxRow> claimedRows =
      emailOutboxWorkerRepository.claimBatch(now, batchSize);

    for (JdbcEmailOutboxWorkerRepository.ClaimedEmailOutboxRow row : claimedRows) {
      processClaimedRow(row);
    }

    return claimedRows.size();
  }

  private void processClaimedRow(JdbcEmailOutboxWorkerRepository.ClaimedEmailOutboxRow row) {
    try {
      emailSender.send(row);
      if (emailOutboxWorkerRepository.markSent(row.id())) {
        log.info("Email outbox item sent successfully. outboxId={}, tenantId={}", row.id(), row.tenantId());
      }
    } catch (Exception exception) {
      handleFailure(row, exception);
    }
  }

  private void handleFailure(
    JdbcEmailOutboxWorkerRepository.ClaimedEmailOutboxRow row,
    Exception exception
  ) {
    int nextAttempt = row.attempts() + 1;
    String lastError = summarizeError(exception);

    if (nextAttempt >= maxAttempts) {
      if (emailOutboxWorkerRepository.markFailed(row.id(), lastError)) {
        log.warn(
          "Email outbox item exhausted retries and was marked failed. outboxId={}, tenantId={}, attempts={}, error={}",
          row.id(),
          row.tenantId(),
          nextAttempt,
          lastError
        );
      }
      return;
    }

    Instant nextScheduledAt = Instant.now().plus(backoffForAttempt(row.attempts()));
    if (emailOutboxWorkerRepository.markPendingRetry(row.id(), lastError, nextScheduledAt)) {
      log.warn(
        "Email outbox item send failed and was rescheduled. outboxId={}, tenantId={}, attempts={}, nextScheduledAt={}, error={}",
        row.id(),
        row.tenantId(),
        nextAttempt,
        nextScheduledAt,
        lastError
      );
    }
  }

  private Duration backoffForAttempt(int attemptsSoFar) {
    long multiplier = 1L << Math.max(0, attemptsSoFar);
    Duration nextBackoff = baseBackoff.multipliedBy(multiplier);
    return nextBackoff.compareTo(maxBackoff) > 0 ? maxBackoff : nextBackoff;
  }

  private String summarizeError(Exception exception) {
    String message = exception.getMessage();
    if (message == null || message.isBlank()) {
      return exception.getClass().getSimpleName();
    }
    return message.length() > 1000 ? message.substring(0, 1000) : message;
  }
}

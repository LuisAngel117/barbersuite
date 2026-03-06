package com.barbersuite.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.icegreen.greenmail.junit5.GreenMailExtension;
import com.icegreen.greenmail.util.ServerSetupTest;
import com.barbersuite.backend.notifications.EmailOutboxWorker;
import java.net.ServerSocket;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MvcResult;

@Import(TestcontainersConfiguration.class)
@SpringBootTest(properties = {
  "notifications.email.worker.enabled=false",
  "notifications.email.worker.max-attempts=3",
  "notifications.email.worker.base-backoff=PT1S",
  "notifications.email.worker.max-backoff=PT5S"
})
class EmailOutboxWorkerIntegrationTest extends AuthenticatedWebIntegrationTestSupport {

  @RegisterExtension
  static GreenMailExtension greenMail = new GreenMailExtension(ServerSetupTest.SMTP);

  @DynamicPropertySource
  static void overrideMailProperties(DynamicPropertyRegistry registry) {
    registry.add("spring.mail.host", () -> "127.0.0.1");
    registry.add("spring.mail.port", () -> ServerSetupTest.SMTP.getPort());
    registry.add("spring.mail.properties.mail.smtp.auth", () -> "false");
    registry.add("spring.mail.properties.mail.smtp.starttls.enable", () -> "false");
    registry.add("notifications.email.from", () -> "noreply@barbersuite.test");
  }

  @Autowired
  private EmailOutboxWorker emailOutboxWorker;

  @Autowired
  private JavaMailSender javaMailSender;

  @BeforeEach
  void resetGreenMailState() throws Exception {
    greenMail.purgeEmailFromAllMailboxes();
    setMailPort(ServerSetupTest.SMTP.getPort());
  }

  @AfterAll
  static void shutdownExecutorSafetyNet() {
    // no-op hook to keep lifecycle explicit in test reports
  }

  @Test
  void workerSendsPendingEmailAndMarksItSent() throws Exception {
    String adminToken = loginAndGetToken();
    UUID outboxId = enqueueTestEmail(
      adminToken,
      "worker.success@barbersuite.test",
      "Worker success",
      "SMTP delivery"
    );

    int processed = emailOutboxWorker.processOnce();

    assertThat(processed).isEqualTo(1);
    assertThat(greenMail.waitForIncomingEmail(5000, 1)).isTrue();
    jakarta.mail.Message[] receivedMessages = greenMail.getReceivedMessages();
    assertThat(receivedMessages).hasSize(1);
    assertThat(receivedMessages[0].getSubject()).isEqualTo("Worker success");
    assertThat(receivedMessages[0].getAllRecipients()[0].toString())
      .isEqualTo("worker.success@barbersuite.test");

    Map<String, Object> row = jdbcTemplate.queryForMap(
      """
      select status, attempts, sent_at, last_error, processing_started_at
      from email_outbox
      where tenant_id = ?
        and id = ?
      """,
      TENANT_ID,
      outboxId
    );
    assertThat(row.get("status")).isEqualTo("sent");
    assertThat(((Number) row.get("attempts")).intValue()).isEqualTo(0);
    assertThat(row.get("sent_at")).isNotNull();
    assertThat(row.get("last_error")).isNull();
    assertThat(row.get("processing_started_at")).isNull();
  }

  @Test
  void workerRetriesAfterFailureAndEventuallySends() throws Exception {
    String adminToken = loginAndGetToken();
    UUID outboxId = enqueueTestEmail(
      adminToken,
      "worker.retry@barbersuite.test",
      "Worker retry",
      "Retry flow"
    );

    int closedPort = findClosedPort();
    setMailPort(closedPort);

    int firstProcessed = emailOutboxWorker.processOnce();
    assertThat(firstProcessed).isEqualTo(1);

    Map<String, Object> failedAttemptRow = jdbcTemplate.queryForMap(
      """
      select status, attempts, last_error, scheduled_at, sent_at
      from email_outbox
      where tenant_id = ?
        and id = ?
      """,
      TENANT_ID,
      outboxId
    );
    assertThat(failedAttemptRow.get("status")).isEqualTo("pending");
    assertThat(((Number) failedAttemptRow.get("attempts")).intValue()).isEqualTo(1);
    assertThat(failedAttemptRow.get("last_error")).isNotNull();
    assertThat(failedAttemptRow.get("sent_at")).isNull();
    Instant nextScheduledAt = ((java.sql.Timestamp) failedAttemptRow.get("scheduled_at")).toInstant();
    assertThat(nextScheduledAt).isAfter(Instant.now().minusSeconds(1));

    jdbcTemplate.update(
      """
      update email_outbox
      set scheduled_at = now()
      where tenant_id = ?
        and id = ?
      """,
      TENANT_ID,
      outboxId
    );

    setMailPort(ServerSetupTest.SMTP.getPort());
    int secondProcessed = emailOutboxWorker.processOnce();

    assertThat(secondProcessed).isEqualTo(1);
    assertThat(greenMail.waitForIncomingEmail(5000, 1)).isTrue();

    Map<String, Object> sentRow = jdbcTemplate.queryForMap(
      """
      select status, attempts, sent_at, last_error
      from email_outbox
      where tenant_id = ?
        and id = ?
      """,
      TENANT_ID,
      outboxId
    );
    assertThat(sentRow.get("status")).isEqualTo("sent");
    assertThat(((Number) sentRow.get("attempts")).intValue()).isEqualTo(1);
    assertThat(sentRow.get("sent_at")).isNotNull();
    assertThat(sentRow.get("last_error")).isNull();
  }

  @Test
  void concurrentWorkersDoNotSendTheSameEmailTwice() throws Exception {
    String adminToken = loginAndGetToken();
    UUID outboxId = enqueueTestEmail(
      adminToken,
      "worker.concurrent@barbersuite.test",
      "Worker concurrency",
      "Exactly once"
    );

    ExecutorService executorService = Executors.newFixedThreadPool(2);
    CountDownLatch startLatch = new CountDownLatch(1);
    try {
      Future<Integer> workerOne = executorService.submit(() -> {
        startLatch.await(5, TimeUnit.SECONDS);
        return emailOutboxWorker.processOnce();
      });
      Future<Integer> workerTwo = executorService.submit(() -> {
        startLatch.await(5, TimeUnit.SECONDS);
        return emailOutboxWorker.processOnce();
      });

      startLatch.countDown();

      int totalProcessed = workerOne.get(10, TimeUnit.SECONDS) + workerTwo.get(10, TimeUnit.SECONDS);
      assertThat(totalProcessed).isEqualTo(1);
    } finally {
      executorService.shutdownNow();
    }

    assertThat(greenMail.waitForIncomingEmail(5000, 1)).isTrue();
    assertThat(greenMail.getReceivedMessages()).hasSize(1);

    Map<String, Object> row = jdbcTemplate.queryForMap(
      """
      select status, attempts
      from email_outbox
      where tenant_id = ?
        and id = ?
      """,
      TENANT_ID,
      outboxId
    );
    assertThat(row.get("status")).isEqualTo("sent");
    assertThat(((Number) row.get("attempts")).intValue()).isEqualTo(0);
  }

  private UUID enqueueTestEmail(
    String token,
    String toEmail,
    String subject,
    String bodyText
  ) throws Exception {
    MvcResult mvcResult = mockMvc.perform(
      post("/api/v1/notifications/email/test")
        .header("Authorization", "Bearer " + token)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "toEmail",
          toEmail,
          "subject",
          subject,
          "bodyText",
          bodyText
        )))
    )
      .andExpect(status().isAccepted())
      .andReturn();

    JsonNode jsonNode = objectMapper.readTree(mvcResult.getResponse().getContentAsByteArray());
    return UUID.fromString(jsonNode.get("outboxId").asText());
  }

  private void setMailPort(int port) {
    ((JavaMailSenderImpl) javaMailSender).setPort(port);
  }

  private int findClosedPort() throws Exception {
    try (ServerSocket serverSocket = new ServerSocket(0)) {
      return serverSocket.getLocalPort();
    }
  }
}

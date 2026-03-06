package com.barbersuite.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class NotificationsEmailIntegrationTest extends AuthenticatedWebIntegrationTestSupport {

  private static final UUID RECEPTION_USER_ID = UUID.fromString(
    "99999999-9999-7999-8999-999999999999"
  );

  @Test
  void adminCanEnqueueAndListEmailOutbox() throws Exception {
    String adminToken = loginAndGetToken();

    MvcResult enqueueResult = mockMvc.perform(
      post("/api/v1/notifications/email/test")
        .header("Authorization", "Bearer " + adminToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "toEmail",
          "demo.notification@barbersuite.test",
          "subject",
          "Test email",
          "bodyText",
          "MailHog connectivity check"
        )))
    )
      .andExpect(status().isAccepted())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
      .andExpect(jsonPath("$.status").value("pending"))
      .andExpect(jsonPath("$.outboxId").isString())
      .andReturn();

    JsonNode enqueueJson = objectMapper.readTree(enqueueResult.getResponse().getContentAsByteArray());
    UUID outboxId = UUID.fromString(enqueueJson.get("outboxId").asText());

    Map<String, Object> storedOutbox = jdbcTemplate.queryForMap(
      """
      select status, attempts, kind, to_email, subject
      from email_outbox
      where tenant_id = ?
        and id = ?
      """,
      TENANT_ID,
      outboxId
    );
    assertThat(storedOutbox.get("status")).isEqualTo("pending");
    assertThat(((Number) storedOutbox.get("attempts")).intValue()).isEqualTo(0);
    assertThat(storedOutbox.get("kind")).isEqualTo("appointment_confirmation");
    assertThat(storedOutbox.get("to_email")).isEqualTo("demo.notification@barbersuite.test");
    assertThat(storedOutbox.get("subject")).isEqualTo("Test email");

    mockMvc.perform(
      get("/api/v1/notifications/email/outbox")
        .header("Authorization", "Bearer " + adminToken)
        .param("page", "0")
        .param("size", "20")
    )
      .andExpect(status().isOk())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
      .andExpect(jsonPath("$.items.length()").value(1))
      .andExpect(jsonPath("$.items[0].id").value(outboxId.toString()))
      .andExpect(jsonPath("$.items[0].status").value("pending"))
      .andExpect(jsonPath("$.items[0].kind").value("appointment_confirmation"))
      .andExpect(jsonPath("$.items[0].toEmail").value("demo.notification@barbersuite.test"))
      .andExpect(jsonPath("$.page").value(0))
      .andExpect(jsonPath("$.size").value(20))
      .andExpect(jsonPath("$.totalItems").value(1))
      .andExpect(jsonPath("$.totalPages").value(1));
  }

  @Test
  void supportsFilteringOutboxByStatusKindAndCreatedDate() throws Exception {
    String adminToken = loginAndGetToken();
    enqueueTestEmail(adminToken, "filters.notification@barbersuite.test", "Filter me", "Pending");

    String todayUtc = LocalDate.now(ZoneOffset.UTC).toString();

    mockMvc.perform(
      get("/api/v1/notifications/email/outbox")
        .header("Authorization", "Bearer " + adminToken)
        .param("status", "pending")
        .param("kind", "appointment_confirmation")
        .param("from", todayUtc)
        .param("to", todayUtc)
        .param("page", "0")
        .param("size", "20")
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items.length()").value(1))
      .andExpect(jsonPath("$.items[0].subject").value("Filter me"))
      .andExpect(jsonPath("$.totalItems").value(1));
  }

  @Test
  void returnsValidationErrorWhenBodyTextAndBodyHtmlAreMissing() throws Exception {
    String adminToken = loginAndGetToken();

    mockMvc.perform(
      post("/api/v1/notifications/email/test")
        .header("Authorization", "Bearer " + adminToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "toEmail",
          "invalid.notification@barbersuite.test",
          "subject",
          "No body"
        )))
    )
      .andExpect(status().isBadRequest())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
  }

  @Test
  void receptionCannotAccessNotificationsEmailApi() throws Exception {
    String receptionToken = seedUserAndIssueToken(
      RECEPTION_USER_ID,
      "Rita Reception",
      "reception.notifications@barbersuite.test",
      PASSWORD,
      "RECEPTION"
    );

    mockMvc.perform(
      post("/api/v1/notifications/email/test")
        .header("Authorization", "Bearer " + receptionToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "toEmail",
          "forbidden.notification@barbersuite.test",
          "subject",
          "Forbidden",
          "bodyText",
          "Forbidden request"
        )))
    )
      .andExpect(status().isForbidden())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("FORBIDDEN"));

    mockMvc.perform(
      get("/api/v1/notifications/email/outbox")
        .header("Authorization", "Bearer " + receptionToken)
    )
      .andExpect(status().isForbidden())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("FORBIDDEN"));
  }

  @Test
  void returnsConflictForDuplicateTestEmailWithinDedupKey() throws Exception {
    String adminToken = loginAndGetToken();

    enqueueTestEmail(
      adminToken,
      "duplicate.notification@barbersuite.test",
      "Duplicate",
      "Same payload"
    );

    mockMvc.perform(
      post("/api/v1/notifications/email/test")
        .header("Authorization", "Bearer " + adminToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "toEmail",
          "duplicate.notification@barbersuite.test",
          "subject",
          "Duplicate",
          "bodyText",
          "Same payload"
        )))
    )
      .andExpect(status().isConflict())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("CONFLICT"));
  }

  private void enqueueTestEmail(
    String token,
    String toEmail,
    String subject,
    String bodyText
  ) throws Exception {
    mockMvc.perform(
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
      .andExpect(status().isAccepted());
  }
}

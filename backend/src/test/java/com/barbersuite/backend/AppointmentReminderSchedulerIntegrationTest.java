package com.barbersuite.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.barbersuite.backend.notifications.AppointmentReminderScheduler;
import com.barbersuite.backend.web.RequestHeaderNames;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

@Import(TestcontainersConfiguration.class)
@SpringBootTest(properties = {
  "notifications.reminders.enabled=false",
  "notifications.email.worker.enabled=false",
})
class AppointmentReminderSchedulerIntegrationTest extends AuthenticatedWebIntegrationTestSupport {

  private static final DateTimeFormatter LOCAL_START_FORMATTER =
    DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");

  @Autowired
  private AppointmentReminderScheduler appointmentReminderScheduler;

  @Test
  void enqueuesReminderWhenScheduledAppointmentIsWithin24HourWindow() throws Exception {
    Instant now = Instant.parse("2026-03-06T15:00:00Z");
    String adminToken = loginAndGetToken();
    UUID barberId = seedBarberWithAccess(
      UUID.fromString("99111111-aaaa-7991-8aaa-111111111111"),
      "Reminder Barber",
      "reminder-barber@barbersuite.test"
    );
    UUID serviceId = createService(adminToken, "Corte reminder", 30, 10.00);
    UUID clientId = createClient(adminToken, "Cliente Reminder", "cliente-reminder@example.com");

    UUID appointmentId = createAppointment(
      adminToken,
      clientId,
      barberId,
      serviceId,
      localStartAt(now.plus(Duration.ofHours(24)))
    );

    appointmentReminderScheduler.runOnce(now);

    Map<String, Object> outboxRow = jdbcTemplate.queryForMap(
      """
      select kind, status, to_email, dedup_key, subject, body_text, scheduled_at
      from email_outbox
      where tenant_id = ?
        and appointment_id = ?
        and kind = 'appointment_reminder'
      """,
      TENANT_ID,
      appointmentId
    );

    assertThat(outboxRow.get("kind")).isEqualTo("appointment_reminder");
    assertThat(outboxRow.get("status")).isEqualTo("pending");
    assertThat(outboxRow.get("to_email")).isEqualTo("cliente-reminder@example.com");
    assertThat(outboxRow.get("dedup_key")).isEqualTo("appt-reminder-24h:" + appointmentId);
    assertThat(outboxRow.get("subject")).isEqualTo("Recordatorio de cita - UIO");
    assertThat((String) outboxRow.get("body_text"))
      .contains("Te recordamos tu cita programada en BarberSuite.")
      .contains("Servicio: Corte reminder")
      .contains("Barbero: Reminder Barber");
    assertThat(outboxRow.get("scheduled_at")).isNotNull();
  }

  @Test
  void skipsReminderWhenClientHasNoEmail() throws Exception {
    Instant now = Instant.parse("2026-03-06T15:00:00Z");
    String adminToken = loginAndGetToken();
    UUID barberId = seedBarberWithAccess(
      UUID.fromString("99222222-aaaa-7992-8aaa-222222222222"),
      "No Email Reminder Barber",
      "no-email-reminder@barbersuite.test"
    );
    UUID serviceId = createService(adminToken, "Corte no email", 30, 11.00);
    UUID clientId = createClient(adminToken, "Cliente Sin Email", null);

    UUID appointmentId = createAppointment(
      adminToken,
      clientId,
      barberId,
      serviceId,
      localStartAt(now.plus(Duration.ofHours(24)))
    );

    appointmentReminderScheduler.runOnce(now);

    Integer reminderCount = jdbcTemplate.queryForObject(
      """
      select count(*)
      from email_outbox
      where tenant_id = ?
        and appointment_id = ?
        and kind = 'appointment_reminder'
      """,
      Integer.class,
      TENANT_ID,
      appointmentId
    );

    assertThat(reminderCount).isZero();
  }

  @Test
  void reminderEnqueueIsIdempotentAcrossSchedulerRuns() throws Exception {
    Instant now = Instant.parse("2026-03-06T15:00:00Z");
    String adminToken = loginAndGetToken();
    UUID barberId = seedBarberWithAccess(
      UUID.fromString("99333333-aaaa-7993-8aaa-333333333333"),
      "Idempotent Reminder Barber",
      "idempotent-reminder@barbersuite.test"
    );
    UUID serviceId = createService(adminToken, "Corte idempotente", 30, 13.00);
    UUID clientId = createClient(adminToken, "Cliente Idempotente", "cliente-idempotente@example.com");

    UUID appointmentId = createAppointment(
      adminToken,
      clientId,
      barberId,
      serviceId,
      localStartAt(now.plus(Duration.ofHours(24)))
    );

    appointmentReminderScheduler.runOnce(now);
    appointmentReminderScheduler.runOnce(now.plusSeconds(30));

    Integer reminderCount = jdbcTemplate.queryForObject(
      """
      select count(*)
      from email_outbox
      where tenant_id = ?
        and dedup_key = ?
      """,
      Integer.class,
      TENANT_ID,
      "appt-reminder-24h:" + appointmentId
    );

    assertThat(reminderCount).isEqualTo(1);
  }

  private UUID seedBarberWithAccess(UUID barberId, String fullName, String email) {
    seedUserAndIssueToken(barberId, fullName, email, PASSWORD, "BARBER");
    grantBranchAccess(barberId, BRANCH_ID);
    seedDefaultBarberAvailability(barberId);
    return barberId;
  }

  private UUID createService(String token, String name, int durationMinutes, double price)
    throws Exception {
    MvcResult mvcResult = mockMvc.perform(
      post("/api/v1/services")
        .header("Authorization", "Bearer " + token)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "name",
          name,
          "durationMinutes",
          durationMinutes,
          "price",
          price
        )))
    )
      .andExpect(status().isCreated())
      .andReturn();

    JsonNode payload = objectMapper.readTree(mvcResult.getResponse().getContentAsByteArray());
    return UUID.fromString(payload.get("id").asText());
  }

  private UUID createClient(String token, String fullName, String email) throws Exception {
    Map<String, Object> payload = new HashMap<>();
    payload.put("fullName", fullName);
    if (email != null) {
      payload.put("email", email);
    }

    MvcResult mvcResult = mockMvc.perform(
      post("/api/v1/clients")
        .header("Authorization", "Bearer " + token)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(payload))
    )
      .andExpect(status().isCreated())
      .andReturn();

    JsonNode response = objectMapper.readTree(mvcResult.getResponse().getContentAsByteArray());
    return UUID.fromString(response.get("id").asText());
  }

  private UUID createAppointment(
    String token,
    UUID clientId,
    UUID barberId,
    UUID serviceId,
    String startAtLocal
  ) throws Exception {
    MvcResult mvcResult = mockMvc.perform(
      post("/api/v1/appointments")
        .header("Authorization", "Bearer " + token)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "clientId",
          clientId,
          "barberId",
          barberId,
          "serviceId",
          serviceId,
          "startAtLocal",
          startAtLocal
        )))
    )
      .andExpect(status().isCreated())
      .andReturn();

    JsonNode response = objectMapper.readTree(mvcResult.getResponse().getContentAsByteArray());
    return UUID.fromString(response.get("id").asText());
  }

  private String localStartAt(Instant instant) {
    return LOCAL_START_FORMATTER.format(instant.atZone(ZoneId.of(BRANCH_TIME_ZONE)));
  }
}

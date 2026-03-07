package com.barbersuite.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.barbersuite.backend.notifications.NotificationsService;
import com.barbersuite.backend.web.RequestHeaderNames;
import java.time.Instant;
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
@SpringBootTest
class AppointmentNotificationsIntegrationTest extends AuthenticatedWebIntegrationTestSupport {

  @Autowired
  private NotificationsService notificationsService;

  @Test
  void reschedulingAppointmentEnqueuesRescheduledEmail() throws Exception {
    String adminToken = loginAndGetToken();
    UUID barberId = seedBarberWithAccess(
      UUID.fromString("99111111-aaaa-7991-8aaa-111111111111"),
      "Rebook Barber",
      "rebook-barber@barbersuite.test"
    );
    UUID serviceId = createService(adminToken, "Corte rebook", 30, 10.00);
    UUID clientId = createClient(adminToken, "Cliente Rebook", "cliente-rebook@example.com");
    UUID appointmentId = createAppointment(
      adminToken,
      clientId,
      barberId,
      serviceId,
      "2026-03-06T10:00"
    );

    patchAppointment(
      adminToken,
      appointmentId,
      Map.of("startAtLocal", "2026-03-06T11:00")
    );

    Map<String, Object> outboxRow = jdbcTemplate.queryForMap(
      """
      select kind, status, dedup_key, subject, body_text
      from email_outbox
      where tenant_id = ?
        and appointment_id = ?
        and kind = 'appointment_rescheduled'
      """,
      TENANT_ID,
      appointmentId
    );

    assertThat(outboxRow.get("kind")).isEqualTo("appointment_rescheduled");
    assertThat(outboxRow.get("status")).isEqualTo("pending");
    assertThat(outboxRow.get("dedup_key"))
      .isEqualTo("appt-rescheduled:" + appointmentId + ":" + Instant.parse("2026-03-06T16:00:00Z").getEpochSecond());
    assertThat(outboxRow.get("subject")).isEqualTo("Tu cita fue reprogramada - UIO");
    assertThat((String) outboxRow.get("body_text"))
      .contains("Cliente Rebook")
      .contains("Servicio: Corte rebook")
      .contains("Barbero: Rebook Barber")
      .contains("Inicio: 2026-03-06 11:00");
  }

  @Test
  void cancellingAppointmentEnqueuesCancelledEmail() throws Exception {
    String adminToken = loginAndGetToken();
    UUID barberId = seedBarberWithAccess(
      UUID.fromString("99222222-aaaa-7992-8aaa-222222222222"),
      "Cancel Barber",
      "cancel-barber@barbersuite.test"
    );
    UUID serviceId = createService(adminToken, "Corte cancel", 30, 11.00);
    UUID clientId = createClient(adminToken, "Cliente Cancel", "cliente-cancel@example.com");
    UUID appointmentId = createAppointment(
      adminToken,
      clientId,
      barberId,
      serviceId,
      "2026-03-06T10:00"
    );

    patchAppointment(
      adminToken,
      appointmentId,
      Map.of("status", "cancelled")
    );

    Map<String, Object> outboxRow = jdbcTemplate.queryForMap(
      """
      select kind, status, dedup_key, subject, body_text
      from email_outbox
      where tenant_id = ?
        and appointment_id = ?
        and kind = 'appointment_cancelled'
      """,
      TENANT_ID,
      appointmentId
    );

    assertThat(outboxRow.get("kind")).isEqualTo("appointment_cancelled");
    assertThat(outboxRow.get("status")).isEqualTo("pending");
    assertThat(outboxRow.get("dedup_key")).isEqualTo("appt-cancelled:" + appointmentId);
    assertThat(outboxRow.get("subject")).isEqualTo("Tu cita fue cancelada - UIO");
    assertThat((String) outboxRow.get("body_text"))
      .contains("Cliente Cancel")
      .contains("Servicio: Corte cancel")
      .contains("Inicio: 2026-03-06 10:00");
  }

  @Test
  void doesNotEnqueueRescheduledOrCancelledEmailsWithoutClientEmail() throws Exception {
    String adminToken = loginAndGetToken();
    UUID barberId = seedBarberWithAccess(
      UUID.fromString("99333333-aaaa-7993-8aaa-333333333333"),
      "No Mail Barber",
      "no-mail-barber-notif@barbersuite.test"
    );
    UUID serviceId = createService(adminToken, "Corte sin notificacion", 30, 9.50);
    UUID clientId = createClient(adminToken, "Cliente Sin Mail", null);
    UUID appointmentId = createAppointment(
      adminToken,
      clientId,
      barberId,
      serviceId,
      "2026-03-06T10:00"
    );

    patchAppointment(
      adminToken,
      appointmentId,
      Map.of("startAtLocal", "2026-03-06T11:00")
    );
    patchAppointment(
      adminToken,
      appointmentId,
      Map.of("status", "cancelled")
    );

    Integer outboxCount = jdbcTemplate.queryForObject(
      """
      select count(*)
      from email_outbox
      where tenant_id = ?
        and appointment_id = ?
        and kind in ('appointment_rescheduled', 'appointment_cancelled')
      """,
      Integer.class,
      TENANT_ID,
      appointmentId
    );

    assertThat(outboxCount).isZero();
  }

  @Test
  void cancellationEnqueueIsIdempotentPerAppointment() throws Exception {
    String adminToken = loginAndGetToken();
    UUID barberId = seedBarberWithAccess(
      UUID.fromString("99444444-aaaa-7994-8aaa-444444444444"),
      "Dedup Cancel Barber",
      "dedup-cancel-barber@barbersuite.test"
    );
    UUID serviceId = createService(adminToken, "Corte dedup cancel", 30, 13.00);
    UUID clientId = createClient(adminToken, "Cliente Dedup Cancel", "cliente-dedup-cancel@example.com");
    UUID appointmentId = createAppointment(
      adminToken,
      clientId,
      barberId,
      serviceId,
      "2026-03-06T10:00"
    );

    patchAppointment(
      adminToken,
      appointmentId,
      Map.of("status", "cancelled")
    );
    notificationsService.enqueueAppointmentCancelled(TENANT_ID, BRANCH_ID, appointmentId);
    notificationsService.enqueueAppointmentCancelled(TENANT_ID, BRANCH_ID, appointmentId);

    Integer outboxCount = jdbcTemplate.queryForObject(
      """
      select count(*)
      from email_outbox
      where tenant_id = ?
        and dedup_key = ?
      """,
      Integer.class,
      TENANT_ID,
      "appt-cancelled:" + appointmentId
    );

    assertThat(outboxCount).isEqualTo(1);
  }

  @Test
  void patchingNotesOnlyDoesNotEnqueueRescheduledEmail() throws Exception {
    String adminToken = loginAndGetToken();
    UUID barberId = seedBarberWithAccess(
      UUID.fromString("99555555-aaaa-7995-8aaa-555555555555"),
      "Notes Barber",
      "notes-barber@barbersuite.test"
    );
    UUID serviceId = createService(adminToken, "Corte notes", 30, 14.00);
    UUID clientId = createClient(adminToken, "Cliente Notes", "cliente-notes@example.com");
    UUID appointmentId = createAppointment(
      adminToken,
      clientId,
      barberId,
      serviceId,
      "2026-03-06T10:00"
    );

    patchAppointment(
      adminToken,
      appointmentId,
      Map.of("notes", "Solo cambia la nota")
    );

    Integer outboxCount = jdbcTemplate.queryForObject(
      """
      select count(*)
      from email_outbox
      where tenant_id = ?
        and appointment_id = ?
        and kind in ('appointment_rescheduled', 'appointment_cancelled')
      """,
      Integer.class,
      TENANT_ID,
      appointmentId
    );

    assertThat(outboxCount).isZero();
  }

  @Test
  void cancellationTakesPriorityOverRescheduledNotification() throws Exception {
    String adminToken = loginAndGetToken();
    UUID barberId = seedBarberWithAccess(
      UUID.fromString("99666666-aaaa-7996-8aaa-666666666666"),
      "Priority Barber",
      "priority-barber@barbersuite.test"
    );
    UUID serviceId = createService(adminToken, "Corte prioridad", 30, 15.00);
    UUID clientId = createClient(adminToken, "Cliente Prioridad", "cliente-prioridad@example.com");
    UUID appointmentId = createAppointment(
      adminToken,
      clientId,
      barberId,
      serviceId,
      "2026-03-06T10:00"
    );

    patchAppointment(
      adminToken,
      appointmentId,
      Map.of(
        "startAtLocal",
        "2026-03-06T11:30",
        "status",
        "cancelled"
      )
    );

    Integer cancelledCount = jdbcTemplate.queryForObject(
      """
      select count(*)
      from email_outbox
      where tenant_id = ?
        and appointment_id = ?
        and kind = 'appointment_cancelled'
      """,
      Integer.class,
      TENANT_ID,
      appointmentId
    );
    Integer rescheduledCount = jdbcTemplate.queryForObject(
      """
      select count(*)
      from email_outbox
      where tenant_id = ?
        and appointment_id = ?
        and kind = 'appointment_rescheduled'
      """,
      Integer.class,
      TENANT_ID,
      appointmentId
    );

    assertThat(cancelledCount).isEqualTo(1);
    assertThat(rescheduledCount).isZero();
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

  private void patchAppointment(String token, UUID appointmentId, Map<String, Object> payload)
    throws Exception {
    mockMvc.perform(
      patch("/api/v1/appointments/{appointmentId}", appointmentId)
        .header("Authorization", "Bearer " + token)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(payload))
    )
      .andExpect(status().isOk());
  }
}

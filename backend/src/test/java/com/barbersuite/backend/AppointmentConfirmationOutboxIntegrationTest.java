package com.barbersuite.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.barbersuite.backend.notifications.NotificationsService;
import com.barbersuite.backend.web.RequestHeaderNames;
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
class AppointmentConfirmationOutboxIntegrationTest extends AuthenticatedWebIntegrationTestSupport {

  @Autowired
  private NotificationsService notificationsService;

  @Test
  void creatingAppointmentWithClientEmailEnqueuesConfirmationEmail() throws Exception {
    String adminToken = loginAndGetToken();
    UUID barberId = seedBarberWithAccess(
      UUID.fromString("88111111-aaaa-7881-8aaa-111111111111"),
      "Mail Barber",
      "mail-barber@barbersuite.test"
    );
    UUID serviceId = createService(adminToken, "Corte mail", 30, 12.00);
    UUID clientId = createClient(
      adminToken,
      "Cliente Mail",
      "cliente-mail@example.com"
    );

    UUID appointmentId = createAppointment(
      adminToken,
      clientId,
      barberId,
      serviceId,
      "2026-03-06T10:00"
    );

    Map<String, Object> outboxRow = jdbcTemplate.queryForMap(
      """
      select appointment_id, kind, status, to_email, dedup_key, subject, body_text
      from email_outbox
      where tenant_id = ?
        and appointment_id = ?
      """,
      TENANT_ID,
      appointmentId
    );

    assertThat(outboxRow.get("appointment_id")).isEqualTo(appointmentId);
    assertThat(outboxRow.get("kind")).isEqualTo("appointment_confirmation");
    assertThat(outboxRow.get("status")).isEqualTo("pending");
    assertThat(outboxRow.get("to_email")).isEqualTo("cliente-mail@example.com");
    assertThat(outboxRow.get("dedup_key")).isEqualTo("appt-confirm:" + appointmentId);
    assertThat(outboxRow.get("subject")).isEqualTo("Confirmacion de cita - UIO");
    assertThat((String) outboxRow.get("body_text"))
      .contains("Sucursal: Sucursal UIO (UIO)")
      .contains("Servicio: Corte mail")
      .contains("Barbero: Mail Barber")
      .contains("Inicio: 2026-03-06 10:00");
  }

  @Test
  void creatingAppointmentWithoutClientEmailDoesNotEnqueueConfirmationEmail() throws Exception {
    String adminToken = loginAndGetToken();
    UUID barberId = seedBarberWithAccess(
      UUID.fromString("88222222-aaaa-7882-8aaa-222222222222"),
      "No Mail Barber",
      "no-mail-barber@barbersuite.test"
    );
    UUID serviceId = createService(adminToken, "Corte sin mail", 25, 9.50);
    UUID clientId = createClient(adminToken, "Cliente Sin Mail", null);

    UUID appointmentId = createAppointment(
      adminToken,
      clientId,
      barberId,
      serviceId,
      "2026-03-06T11:00"
    );

    Integer outboxCount = jdbcTemplate.queryForObject(
      """
      select count(*)
      from email_outbox
      where tenant_id = ?
        and appointment_id = ?
      """,
      Integer.class,
      TENANT_ID,
      appointmentId
    );

    assertThat(outboxCount).isZero();
  }

  @Test
  void enqueueAppointmentConfirmationIsIdempotentPerAppointment() throws Exception {
    String adminToken = loginAndGetToken();
    UUID barberId = seedBarberWithAccess(
      UUID.fromString("88333333-aaaa-7883-8aaa-333333333333"),
      "Dedup Barber",
      "dedup-barber@barbersuite.test"
    );
    UUID serviceId = createService(adminToken, "Corte dedup", 40, 14.00);
    UUID clientId = createClient(adminToken, "Cliente Dedup", "cliente-dedup@example.com");

    UUID appointmentId = createAppointment(
      adminToken,
      clientId,
      barberId,
      serviceId,
      "2026-03-06T12:00"
    );

    notificationsService.enqueueAppointmentConfirmation(TENANT_ID, BRANCH_ID, appointmentId);
    notificationsService.enqueueAppointmentConfirmation(TENANT_ID, BRANCH_ID, appointmentId);

    Integer outboxCount = jdbcTemplate.queryForObject(
      """
      select count(*)
      from email_outbox
      where tenant_id = ?
        and dedup_key = ?
      """,
      Integer.class,
      TENANT_ID,
      "appt-confirm:" + appointmentId
    );

    assertThat(outboxCount).isEqualTo(1);
  }

  private UUID seedBarberWithAccess(UUID barberId, String fullName, String email) {
    seedUserAndIssueToken(barberId, fullName, email, PASSWORD, "BARBER");
    grantBranchAccess(barberId, BRANCH_ID);
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
}

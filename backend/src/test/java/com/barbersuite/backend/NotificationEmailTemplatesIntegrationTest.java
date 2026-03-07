package com.barbersuite.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.barbersuite.backend.web.RequestHeaderNames;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class NotificationEmailTemplatesIntegrationTest extends AuthenticatedWebIntegrationTestSupport {

  private static final UUID RECEPTION_USER_ID = UUID.fromString(
    "a1111111-aaaa-7a11-8aaa-111111111111"
  );

  @Test
  void getTemplatesReturnsAllSupportedKindsWithFallbackDefaults() throws Exception {
    String adminToken = loginAndGetToken();

    MvcResult result = mockMvc.perform(
      get("/api/v1/notifications/email/templates")
        .header("Authorization", "Bearer " + adminToken)
    )
      .andExpect(status().isOk())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
      .andReturn();

    JsonNode items = objectMapper.readTree(result.getResponse().getContentAsByteArray()).get("items");
    assertThat(items).hasSize(4);
    assertThat(extractKinds(items)).containsExactly(
      "appointment_confirmation",
      "appointment_reminder",
      "appointment_rescheduled",
      "appointment_cancelled"
    );
    assertThat(findTemplate(items, "appointment_confirmation").get("enabled").asBoolean()).isTrue();
    assertThat(findTemplate(items, "appointment_confirmation").get("subjectTemplate").asText())
      .isEqualTo("Confirmacion de cita - ${branchCode}");
    assertThat(findTemplate(items, "appointment_reminder").get("subjectTemplate").asText())
      .isEqualTo("Recordatorio de cita - ${branchCode}");
    assertThat(findTemplate(items, "appointment_rescheduled").get("subjectTemplate").asText())
      .isEqualTo("Tu cita fue reprogramada - ${branchCode}");
    assertThat(findTemplate(items, "appointment_cancelled").get("subjectTemplate").asText())
      .isEqualTo("Tu cita fue cancelada - ${branchCode}");
  }

  @Test
  void putPersistsOverrideAndGetReturnsIt() throws Exception {
    String adminToken = loginAndGetToken();

    mockMvc.perform(
      put("/api/v1/notifications/email/templates/appointment_confirmation")
        .header("Authorization", "Bearer " + adminToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "enabled",
          true,
          "subjectTemplate",
          "Custom ${branchCode}",
          "bodyTextTemplate",
          "Hola ${clientName}"
        )))
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.kind").value("appointment_confirmation"))
      .andExpect(jsonPath("$.enabled").value(true))
      .andExpect(jsonPath("$.subjectTemplate").value("Custom ${branchCode}"))
      .andExpect(jsonPath("$.bodyTextTemplate").value("Hola ${clientName}"));

    MvcResult result = mockMvc.perform(
      get("/api/v1/notifications/email/templates")
        .header("Authorization", "Bearer " + adminToken)
    )
      .andExpect(status().isOk())
      .andReturn();

    JsonNode items = objectMapper.readTree(result.getResponse().getContentAsByteArray()).get("items");
    JsonNode template = findTemplate(items, "appointment_confirmation");
    assertThat(template.get("subjectTemplate").asText()).isEqualTo("Custom ${branchCode}");
    assertThat(template.get("bodyTextTemplate").asText()).isEqualTo("Hola ${clientName}");
  }

  @Test
  void appointmentConfirmationUsesTenantTemplateOverride() throws Exception {
    String adminToken = loginAndGetToken();
    UUID barberId = seedBarberWithAccess(
      UUID.fromString("a2222222-aaaa-7a22-8aaa-222222222222"),
      "Template Barber",
      "template-barber@barbersuite.test"
    );
    UUID serviceId = createService(adminToken, "Corte template", 30, 12.00);
    UUID clientId = createClient(adminToken, "Cliente Template", "cliente-template@example.com");

    mockMvc.perform(
      put("/api/v1/notifications/email/templates/appointment_confirmation")
        .header("Authorization", "Bearer " + adminToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "enabled",
          true,
          "subjectTemplate",
          "CUSTOM ${branchCode}",
          "bodyTextTemplate",
          "Servicio=${serviceName}; Barbero=${barberName}; Inicio=${startAtLocal}; Cliente=${clientName}"
        )))
    )
      .andExpect(status().isOk());

    UUID appointmentId = createAppointment(
      adminToken,
      clientId,
      barberId,
      serviceId,
      "2026-03-06T10:00"
    );

    Map<String, Object> outboxRow = jdbcTemplate.queryForMap(
      """
      select subject, body_text
      from email_outbox
      where tenant_id = ?
        and appointment_id = ?
        and kind = 'appointment_confirmation'
      """,
      TENANT_ID,
      appointmentId
    );

    assertThat(outboxRow.get("subject")).isEqualTo("CUSTOM UIO");
    assertThat((String) outboxRow.get("body_text"))
      .contains("Servicio=Corte template")
      .contains("Barbero=Template Barber")
      .contains("Inicio=2026-03-06 10:00")
      .contains("Cliente=Cliente Template");
  }

  @Test
  void disabledTemplatePreventsAppointmentConfirmationEnqueue() throws Exception {
    String adminToken = loginAndGetToken();
    UUID barberId = seedBarberWithAccess(
      UUID.fromString("a3333333-aaaa-7a33-8aaa-333333333333"),
      "Disabled Template Barber",
      "disabled-template-barber@barbersuite.test"
    );
    UUID serviceId = createService(adminToken, "Corte disabled", 30, 13.50);
    UUID clientId = createClient(adminToken, "Cliente Disabled", "cliente-disabled@example.com");

    mockMvc.perform(
      put("/api/v1/notifications/email/templates/appointment_confirmation")
        .header("Authorization", "Bearer " + adminToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "enabled",
          false,
          "subjectTemplate",
          "Disabled ${branchCode}",
          "bodyTextTemplate",
          "No deberia enviarse"
        )))
    )
      .andExpect(status().isOk());

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
        and kind = 'appointment_confirmation'
      """,
      Integer.class,
      TENANT_ID,
      appointmentId
    );

    assertThat(outboxCount).isZero();
  }

  @Test
  void receptionCannotManageNotificationTemplates() throws Exception {
    String receptionToken = seedUserAndIssueToken(
      RECEPTION_USER_ID,
      "Nora Reception",
      "reception.templates@barbersuite.test",
      PASSWORD,
      "RECEPTION"
    );

    mockMvc.perform(
      get("/api/v1/notifications/email/templates")
        .header("Authorization", "Bearer " + receptionToken)
    )
      .andExpect(status().isForbidden())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("FORBIDDEN"));

    mockMvc.perform(
      put("/api/v1/notifications/email/templates/appointment_confirmation")
        .header("Authorization", "Bearer " + receptionToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "enabled",
          true,
          "subjectTemplate",
          "Forbidden",
          "bodyTextTemplate",
          "Forbidden"
        )))
    )
      .andExpect(status().isForbidden())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("FORBIDDEN"));
  }

  private Set<String> extractKinds(JsonNode items) {
    Set<String> kinds = new java.util.LinkedHashSet<>();
    for (JsonNode item : items) {
      kinds.add(item.get("kind").asText());
    }
    return kinds;
  }

  private JsonNode findTemplate(JsonNode items, String kind) {
    for (JsonNode item : items) {
      if (kind.equals(item.get("kind").asText())) {
        return item;
      }
    }
    throw new AssertionError("Template kind not found: " + kind);
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
}

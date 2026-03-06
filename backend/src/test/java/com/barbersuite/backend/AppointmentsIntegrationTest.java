package com.barbersuite.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.barbersuite.backend.web.RequestHeaderNames;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class AppointmentsIntegrationTest extends AuthenticatedWebIntegrationTestSupport {

  @Test
  void adminCanCreateListGetAndPatchAppointments() throws Exception {
    String adminToken = loginAndGetToken();
    UUID barberId = seedBarberWithAccess(
      UUID.fromString("55555555-aaaa-7555-8aaa-555555555555"),
      "Pablo Barber",
      "pablo-barber@barbersuite.test"
    );
    UUID serviceId = createService(adminToken, "Corte agenda", 30, 10.00);
    UUID clientId = createClient(adminToken, "Carlos Agenda", "carlos-agenda@example.com");

    MvcResult createResult = mockMvc.perform(
      post("/api/v1/appointments")
        .header("Authorization", "Bearer " + adminToken)
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
          "2026-03-06T10:00",
          "notes",
          "Cliente puntual"
        )))
    )
      .andExpect(status().isCreated())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
      .andExpect(jsonPath("$.clientId").value(clientId.toString()))
      .andExpect(jsonPath("$.barberId").value(barberId.toString()))
      .andExpect(jsonPath("$.serviceId").value(serviceId.toString()))
      .andExpect(jsonPath("$.status").value("scheduled"))
      .andExpect(jsonPath("$.notes").value("Cliente puntual"))
      .andReturn();

    JsonNode createdAppointment = objectMapper.readTree(createResult.getResponse().getContentAsByteArray());
    UUID appointmentId = UUID.fromString(createdAppointment.get("id").asText());
    Instant startAt = Instant.parse(createdAppointment.get("startAt").asText());
    Instant endAt = Instant.parse(createdAppointment.get("endAt").asText());

    assertThat(startAt).isEqualTo(Instant.parse("2026-03-06T15:00:00Z"));
    assertThat(endAt).isEqualTo(Instant.parse("2026-03-06T15:30:00Z"));
    assertThat(Duration.between(startAt, endAt)).isEqualTo(Duration.ofMinutes(30));

    mockMvc.perform(
      get("/api/v1/appointments")
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .queryParam("from", "2026-03-06")
        .queryParam("to", "2026-03-06")
    )
      .andExpect(status().isOk())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
      .andExpect(jsonPath("$.items[0].id").value(appointmentId.toString()))
      .andExpect(jsonPath("$.items[0].status").value("scheduled"));

    mockMvc.perform(
      get("/api/v1/appointments/{appointmentId}", appointmentId)
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.id").value(appointmentId.toString()))
      .andExpect(jsonPath("$.clientId").value(clientId.toString()));

    mockMvc.perform(
      patch("/api/v1/appointments/{appointmentId}", appointmentId)
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "status",
          "completed",
          "notes",
          "Cliente atendido"
        )))
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.id").value(appointmentId.toString()))
      .andExpect(jsonPath("$.status").value("completed"))
      .andExpect(jsonPath("$.notes").value("Cliente atendido"));

    Map<String, Object> persistedAppointment = jdbcTemplate.queryForMap(
      """
      select status, notes, start_at, end_at, updated_at
      from appointments
      where tenant_id = ?
        and branch_id = ?
        and id = ?
      """,
      TENANT_ID,
      BRANCH_ID,
      appointmentId
    );

    assertThat(persistedAppointment.get("status")).isEqualTo("completed");
    assertThat(persistedAppointment.get("notes")).isEqualTo("Cliente atendido");
    assertThat(((Timestamp) persistedAppointment.get("start_at")).toInstant()).isEqualTo(startAt);
    assertThat(((Timestamp) persistedAppointment.get("end_at")).toInstant()).isEqualTo(endAt);
    assertThat(persistedAppointment.get("updated_at")).isInstanceOf(Timestamp.class);
  }

  @Test
  void returnsConflictWhenAppointmentOverlapsForSameBarber() throws Exception {
    String adminToken = loginAndGetToken();
    UUID barberId = seedBarberWithAccess(
      UUID.fromString("66666666-aaaa-7666-8aaa-666666666666"),
      "Overlap Barber",
      "overlap-barber@barbersuite.test"
    );
    UUID serviceId = createService(adminToken, "Corte overlap", 30, 11.00);
    UUID firstClientId = createClient(adminToken, "Cliente Uno", "cliente-uno@example.com");
    UUID secondClientId = createClient(adminToken, "Cliente Dos", "cliente-dos@example.com");

    createAppointment(adminToken, firstClientId, barberId, serviceId, "2026-03-06T10:00");

    mockMvc.perform(
      post("/api/v1/appointments")
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "clientId",
          secondClientId,
          "barberId",
          barberId,
          "serviceId",
          serviceId,
          "startAtLocal",
          "2026-03-06T10:15"
        )))
    )
      .andExpect(status().isConflict())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.title").value("Appointment overlap"))
      .andExpect(jsonPath("$.code").value("APPOINTMENT_OVERLAP"))
      .andExpect(jsonPath("$.instance").value("/api/v1/appointments"));
  }

  @Test
  void barberCanReadButCannotMutateAppointments() throws Exception {
    String adminToken = loginAndGetToken();
    UUID barberId = UUID.fromString("77777777-aaaa-7777-8aaa-777777777777");
    String barberToken = seedUserAndIssueToken(
      barberId,
      "Readonly Barber",
      "readonly-barber@barbersuite.test",
      PASSWORD,
      "BARBER"
    );
    grantBranchAccess(barberId, BRANCH_ID);

    UUID serviceId = createService(adminToken, "Corte barber", 25, 9.50);
    UUID clientId = createClient(adminToken, "Cliente Barber", "cliente-barber@example.com");
    UUID appointmentId = createAppointment(
      adminToken,
      clientId,
      barberId,
      serviceId,
      "2026-03-06T11:00"
    );

    mockMvc.perform(
      get("/api/v1/appointments")
        .header("Authorization", "Bearer " + barberToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items[0].id").value(appointmentId.toString()));

    mockMvc.perform(
      post("/api/v1/appointments")
        .header("Authorization", "Bearer " + barberToken)
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
          "2026-03-06T12:00"
        )))
    )
      .andExpect(status().isForbidden())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("FORBIDDEN"));

    mockMvc.perform(
      patch("/api/v1/appointments/{appointmentId}", appointmentId)
        .header("Authorization", "Bearer " + barberToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of("status", "completed")))
    )
      .andExpect(status().isForbidden())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("FORBIDDEN"));
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
    MvcResult mvcResult = mockMvc.perform(
      post("/api/v1/clients")
        .header("Authorization", "Bearer " + token)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "fullName",
          fullName,
          "email",
          email
        )))
    )
      .andExpect(status().isCreated())
      .andReturn();

    JsonNode payload = objectMapper.readTree(mvcResult.getResponse().getContentAsByteArray());
    return UUID.fromString(payload.get("id").asText());
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

    JsonNode payload = objectMapper.readTree(mvcResult.getResponse().getContentAsByteArray());
    return UUID.fromString(payload.get("id").asText());
  }
}

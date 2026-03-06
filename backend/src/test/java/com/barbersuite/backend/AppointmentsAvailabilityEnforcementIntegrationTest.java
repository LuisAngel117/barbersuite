package com.barbersuite.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.barbersuite.backend.web.RequestHeaderNames;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class AppointmentsAvailabilityEnforcementIntegrationTest extends AuthenticatedWebIntegrationTestSupport {

  @Test
  void createsAppointmentWhenRangeFitsBarberAvailability() throws Exception {
    String adminToken = loginAndGetToken();
    UUID barberId = createBarber(
      adminToken,
      "Disponibilidad Barber",
      "disponibilidad-barber@barbersuite.test"
    );
    UUID serviceId = createService(adminToken, "Corte availability", 30, 12.00);
    UUID clientId = createClient(adminToken, "Cliente Availability", "cliente-availability@example.com");

    putAvailability(
      adminToken,
      barberId,
      List.of(weeklyInterval(1, "09:00", "12:00")),
      List.of()
    );

    mockMvc.perform(
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
          "2026-03-09T10:00"
        )))
    )
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.status").value("scheduled"));
  }

  @Test
  void rejectsCreateOutsideAvailabilityWindow() throws Exception {
    String adminToken = loginAndGetToken();
    UUID barberId = createBarber(
      adminToken,
      "Fuera Horario Barber",
      "fuera-horario-barber@barbersuite.test"
    );
    UUID serviceId = createService(adminToken, "Corte fuera", 30, 10.00);
    UUID clientId = createClient(adminToken, "Cliente Fuera", "cliente-fuera@example.com");

    putAvailability(
      adminToken,
      barberId,
      List.of(weeklyInterval(1, "09:00", "12:00")),
      List.of()
    );

    mockMvc.perform(
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
          "2026-03-09T08:00"
        )))
    )
      .andExpect(status().isConflict())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.title").value("Appointment outside availability"))
      .andExpect(jsonPath("$.code").value("APPOINTMENT_OUTSIDE_AVAILABILITY"));
  }

  @Test
  void rejectsPatchWhenMovingAppointmentOutsideAvailability() throws Exception {
    String adminToken = loginAndGetToken();
    UUID barberId = createBarber(
      adminToken,
      "Patch Barber",
      "patch-barber@barbersuite.test"
    );
    UUID serviceId = createService(adminToken, "Corte patch", 30, 11.00);
    UUID clientId = createClient(adminToken, "Cliente Patch", "cliente-patch@example.com");

    putAvailability(
      adminToken,
      barberId,
      List.of(weeklyInterval(1, "09:00", "12:00")),
      List.of()
    );

    UUID appointmentId = createAppointment(
      adminToken,
      clientId,
      barberId,
      serviceId,
      "2026-03-09T10:00"
    );

    mockMvc.perform(
      patch("/api/v1/appointments/{appointmentId}", appointmentId)
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "startAtLocal",
          "2026-03-09T08:30"
        )))
    )
      .andExpect(status().isConflict())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("APPOINTMENT_OUTSIDE_AVAILABILITY"));
  }

  @Test
  void closedExceptionOverridesWeeklyAvailability() throws Exception {
    String adminToken = loginAndGetToken();
    UUID barberId = createBarber(
      adminToken,
      "Closed Barber",
      "closed-barber@barbersuite.test"
    );
    UUID serviceId = createService(adminToken, "Corte closed", 30, 9.00);
    UUID clientId = createClient(adminToken, "Cliente Closed", "cliente-closed@example.com");

    putAvailability(
      adminToken,
      barberId,
      List.of(weeklyInterval(1, "09:00", "12:00")),
      List.of(Map.of(
        "date",
        "2026-03-09",
        "type",
        "closed",
        "note",
        "Dia libre",
        "intervals",
        List.of()
      ))
    );

    mockMvc.perform(
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
          "2026-03-09T10:00"
        )))
    )
      .andExpect(status().isConflict())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("APPOINTMENT_OUTSIDE_AVAILABILITY"));
  }

  private UUID createBarber(String token, String fullName, String email) throws Exception {
    MvcResult mvcResult = mockMvc.perform(
      post("/api/v1/staff/barbers")
        .header("Authorization", "Bearer " + token)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "fullName",
          fullName,
          "email",
          email,
          "password",
          "Barber123!",
          "branchIds",
          List.of(BRANCH_ID)
        )))
    )
      .andExpect(status().isCreated())
      .andReturn();

    JsonNode payload = objectMapper.readTree(mvcResult.getResponse().getContentAsByteArray());
    return UUID.fromString(payload.get("id").asText());
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

  private void putAvailability(
    String token,
    UUID barberId,
    List<Map<String, Object>> weekly,
    List<Map<String, Object>> exceptions
  ) throws Exception {
    mockMvc.perform(
      put("/api/v1/availability/barbers/{barberId}", barberId)
        .header("Authorization", "Bearer " + token)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "weekly",
          weekly,
          "exceptions",
          exceptions
        )))
    )
      .andExpect(status().isOk());
  }

  private Map<String, Object> weeklyInterval(int dayOfWeek, String start, String end) {
    Map<String, Object> interval = new LinkedHashMap<>();
    interval.put("dayOfWeek", dayOfWeek);
    interval.put("start", start);
    interval.put("end", end);
    return interval;
  }
}

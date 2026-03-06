package com.barbersuite.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
class AvailabilityIntegrationTest extends AuthenticatedWebIntegrationTestSupport {

  private static final UUID RECEPTION_USER_ID = UUID.fromString(
    "91919191-1111-7111-8111-191919191919"
  );
  private static final UUID BARBER_USER_ID = UUID.fromString(
    "92929292-2222-7222-8222-292929292929"
  );

  @Test
  void adminCanReplaceAndReadBarberAvailability() throws Exception {
    String adminToken = loginAndGetToken();
    UUID barberId = createBarber(adminToken, "Bruno Horarios", "bruno-horarios@barbersuite.test");

    MvcResult putResult = putAvailability(
      adminToken,
      barberId,
      List.of(
        weeklyInterval(1, "09:00", "12:00"),
        weeklyInterval(2, "09:00", "12:00"),
        weeklyInterval(3, "09:00", "12:00"),
        weeklyInterval(4, "09:00", "12:00"),
        weeklyInterval(5, "09:00", "12:00")
      ),
      List.of()
    );

    JsonNode putPayload = objectMapper.readTree(putResult.getResponse().getContentAsByteArray());
    assertThat(putPayload.get("barberId").asText()).isEqualTo(barberId.toString());
    assertThat(putPayload.get("weekly")).hasSize(5);
    assertThat(putPayload.get("exceptions")).hasSize(0);

    mockMvc.perform(
      get("/api/v1/availability/barbers")
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .queryParam("barberId", barberId.toString())
    )
      .andExpect(status().isOk())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
      .andExpect(jsonPath("$.items.length()").value(1))
      .andExpect(jsonPath("$.items[0].barberId").value(barberId.toString()))
      .andExpect(jsonPath("$.items[0].weekly.length()").value(5))
      .andExpect(jsonPath("$.items[0].weekly[0].dayOfWeek").value(1))
      .andExpect(jsonPath("$.items[0].weekly[0].start").value("09:00"))
      .andExpect(jsonPath("$.items[0].weekly[0].end").value("12:00"))
      .andExpect(jsonPath("$.items[0].exceptions.length()").value(0));
  }

  @Test
  void receptionAndBarberCannotReplaceAvailability() throws Exception {
    String adminToken = loginAndGetToken();
    UUID barberId = createBarber(adminToken, "Lucia Agenda", "lucia-agenda@barbersuite.test");

    String receptionToken = seedUserAndIssueToken(
      RECEPTION_USER_ID,
      "Rita Reception",
      "rita-availability@barbersuite.test",
      PASSWORD,
      "RECEPTION"
    );
    grantBranchAccess(RECEPTION_USER_ID, BRANCH_ID);

    String barberToken = seedUserAndIssueToken(
      BARBER_USER_ID,
      "Pablo Barber",
      "pablo-availability@barbersuite.test",
      PASSWORD,
      "BARBER"
    );
    grantBranchAccess(BARBER_USER_ID, BRANCH_ID);

    Map<String, Object> payload = Map.of(
      "weekly",
      List.of(weeklyInterval(1, "09:00", "12:00")),
      "exceptions",
      List.of()
    );

    mockMvc.perform(
      put("/api/v1/availability/barbers/{barberId}", barberId)
        .header("Authorization", "Bearer " + receptionToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(payload))
    )
      .andExpect(status().isForbidden())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("FORBIDDEN"));

    mockMvc.perform(
      put("/api/v1/availability/barbers/{barberId}", barberId)
        .header("Authorization", "Bearer " + barberToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(payload))
    )
      .andExpect(status().isForbidden())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("FORBIDDEN"));
  }

  @Test
  void slotsRespectAvailabilityAndBusyAppointments() throws Exception {
    String adminToken = loginAndGetToken();
    UUID barberId = createBarber(adminToken, "Mateo Slots", "mateo-slots@barbersuite.test");
    UUID serviceId = createService(adminToken, "Corte slots", 30, "12.00");
    UUID clientId = createClient(adminToken, "Cliente Slots", "cliente-slots@example.com");

    putAvailability(
      adminToken,
      barberId,
      List.of(
        weeklyInterval(1, "09:00", "12:00"),
        weeklyInterval(2, "09:00", "12:00"),
        weeklyInterval(3, "09:00", "12:00"),
        weeklyInterval(4, "09:00", "12:00"),
        weeklyInterval(5, "09:00", "12:00")
      ),
      List.of()
    );

    createAppointment(adminToken, clientId, barberId, serviceId, "2026-03-09T10:00");

    MvcResult result = mockMvc.perform(
      get("/api/v1/availability/slots")
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .queryParam("date", "2026-03-09")
        .queryParam("serviceId", serviceId.toString())
        .queryParam("barberId", barberId.toString())
    )
      .andExpect(status().isOk())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
      .andExpect(jsonPath("$.timeZone").value(BRANCH_TIME_ZONE))
      .andExpect(jsonPath("$.items.length()").value(1))
      .andReturn();

    JsonNode payload = objectMapper.readTree(result.getResponse().getContentAsByteArray());
    List<String> slots = toSlotList(payload.at("/items/0/slots"));

    assertThat(slots).contains("09:00", "09:15", "09:30", "10:30", "11:30");
    assertThat(slots).doesNotContain("09:45", "10:00", "10:15");
  }

  @Test
  void closedExceptionProducesNoSlotsForThatDay() throws Exception {
    String adminToken = loginAndGetToken();
    UUID barberId = createBarber(adminToken, "Valeria Closed", "valeria-closed@barbersuite.test");
    UUID serviceId = createService(adminToken, "Corte closed", 30, "8.00");

    putAvailability(
      adminToken,
      barberId,
      List.of(
        weeklyInterval(1, "09:00", "12:00"),
        weeklyInterval(2, "09:00", "12:00"),
        weeklyInterval(3, "09:00", "12:00"),
        weeklyInterval(4, "09:00", "12:00"),
        weeklyInterval(5, "09:00", "12:00")
      ),
      List.of(Map.of(
        "date",
        "2026-03-10",
        "type",
        "closed",
        "note",
        "Vacaciones",
        "intervals",
        List.of()
      ))
    );

    mockMvc.perform(
      get("/api/v1/availability/slots")
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .queryParam("date", "2026-03-10")
        .queryParam("serviceId", serviceId.toString())
        .queryParam("barberId", barberId.toString())
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items.length()").value(1))
      .andExpect(jsonPath("$.items[0].slots.length()").value(0));
  }

  @Test
  void rejectsOverlappingWeeklyIntervals() throws Exception {
    String adminToken = loginAndGetToken();
    UUID barberId = createBarber(adminToken, "Sofia Overlap", "sofia-overlap@barbersuite.test");

    mockMvc.perform(
      put("/api/v1/availability/barbers/{barberId}", barberId)
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "weekly",
          List.of(
            weeklyInterval(1, "09:00", "12:00"),
            weeklyInterval(1, "11:00", "13:00")
          ),
          "exceptions",
          List.of()
        )))
    )
      .andExpect(status().isBadRequest())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
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

  private UUID createService(String token, String name, int durationMinutes, String price)
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

  private MvcResult putAvailability(
    String token,
    UUID barberId,
    List<Map<String, Object>> weekly,
    List<Map<String, Object>> exceptions
  ) throws Exception {
    return mockMvc.perform(
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
      .andExpect(status().isOk())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
      .andReturn();
  }

  private Map<String, Object> weeklyInterval(int dayOfWeek, String start, String end) {
    Map<String, Object> interval = new LinkedHashMap<>();
    interval.put("dayOfWeek", dayOfWeek);
    interval.put("start", start);
    interval.put("end", end);
    return interval;
  }

  private List<String> toSlotList(JsonNode slotsNode) {
    java.util.ArrayList<String> slots = new java.util.ArrayList<>();
    for (JsonNode slotNode : slotsNode) {
      slots.add(slotNode.asText());
    }
    return slots;
  }
}

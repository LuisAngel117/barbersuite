package com.barbersuite.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.barbersuite.backend.web.RequestHeaderNames;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
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
class ClientHistoryIntegrationTest extends AuthenticatedWebIntegrationTestSupport {

  @Test
  void returnsClientHistoryWithAppointmentsReceiptsAndStats() throws Exception {
    String adminToken = loginAndGetToken();
    UUID barberId = seedBarberWithAccess(
      UUID.fromString("12121212-aaaa-7111-8aaa-121212121212"),
      "Diego Barber",
      "diego-history@barbersuite.test"
    );
    UUID serviceId = createService(adminToken, "Corte historial", 30, new BigDecimal("18.00"));
    UUID clientId = createClient(adminToken, "Cliente Historial", "cliente-history@example.com");

    UUID completedAppointmentId = createAppointment(
      adminToken,
      clientId,
      barberId,
      serviceId,
      "2026-03-10T10:00"
    );
    patchAppointmentStatus(adminToken, completedAppointmentId, "completed");

    UUID noShowAppointmentId = createAppointment(
      adminToken,
      clientId,
      barberId,
      serviceId,
      "2026-03-12T11:00"
    );
    patchAppointmentStatus(adminToken, noShowAppointmentId, "no_show");

    UUID issuedReceiptId = createReceipt(
      adminToken,
      clientId,
      serviceId,
      "Corte historial",
      new BigDecimal("18.00")
    );
    updateReceiptIssuedAt(issuedReceiptId, Instant.parse("2026-03-10T15:30:00Z"));

    UUID voidedReceiptId = createReceipt(
      adminToken,
      clientId,
      serviceId,
      "Corte voided",
      new BigDecimal("25.00")
    );
    updateReceiptIssuedAt(voidedReceiptId, Instant.parse("2026-03-12T16:00:00Z"));
    voidReceipt(adminToken, voidedReceiptId, "Ajuste de caja");

    mockMvc.perform(
      get("/api/v1/clients/{clientId}/history", clientId)
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
    )
      .andExpect(status().isOk())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
      .andExpect(jsonPath("$.client.id").value(clientId.toString()))
      .andExpect(jsonPath("$.client.fullName").value("Cliente Historial"))
      .andExpect(jsonPath("$.appointments.length()").value(2))
      .andExpect(jsonPath("$.appointments[0].id").value(noShowAppointmentId.toString()))
      .andExpect(jsonPath("$.appointments[0].status").value("no_show"))
      .andExpect(jsonPath("$.appointments[0].barberName").value("Diego Barber"))
      .andExpect(jsonPath("$.appointments[0].serviceName").value("Corte historial"))
      .andExpect(jsonPath("$.appointments[1].id").value(completedAppointmentId.toString()))
      .andExpect(jsonPath("$.appointments[1].status").value("completed"))
      .andExpect(jsonPath("$.receipts.length()").value(2))
      .andExpect(jsonPath("$.receipts[0].id").value(voidedReceiptId.toString()))
      .andExpect(jsonPath("$.receipts[0].status").value("voided"))
      .andExpect(jsonPath("$.receipts[1].id").value(issuedReceiptId.toString()))
      .andExpect(jsonPath("$.receipts[1].status").value("issued"))
      .andExpect(jsonPath("$.stats.totalVisits").value(1))
      .andExpect(jsonPath("$.stats.noShows").value(1))
      .andExpect(jsonPath("$.stats.totalSpend").value(18.0));
  }

  @Test
  void filtersHistoryByDateAndAppliesLimit() throws Exception {
    String adminToken = loginAndGetToken();
    UUID barberId = seedBarberWithAccess(
      UUID.fromString("13131313-aaaa-7111-8aaa-131313131313"),
      "Laura Barber",
      "laura-history@barbersuite.test"
    );
    UUID serviceId = createService(adminToken, "Color historial", 30, new BigDecimal("22.00"));
    UUID clientId = createClient(adminToken, "Cliente Filtros", "cliente-filtros@example.com");

    UUID firstAppointmentId = createAppointment(
      adminToken,
      clientId,
      barberId,
      serviceId,
      "2026-03-10T09:00"
    );
    patchAppointmentStatus(adminToken, firstAppointmentId, "completed");

    UUID secondAppointmentId = createAppointment(
      adminToken,
      clientId,
      barberId,
      serviceId,
      "2026-03-12T11:00"
    );
    patchAppointmentStatus(adminToken, secondAppointmentId, "no_show");

    UUID firstReceiptId = createReceipt(
      adminToken,
      clientId,
      serviceId,
      "Color historial",
      new BigDecimal("22.00")
    );
    updateReceiptIssuedAt(firstReceiptId, Instant.parse("2026-03-10T17:00:00Z"));

    UUID secondReceiptId = createReceipt(
      adminToken,
      clientId,
      serviceId,
      "Color historial 2",
      new BigDecimal("30.00")
    );
    updateReceiptIssuedAt(secondReceiptId, Instant.parse("2026-03-12T18:00:00Z"));
    voidReceipt(adminToken, secondReceiptId, "Reverso");

    mockMvc.perform(
      get("/api/v1/clients/{clientId}/history", clientId)
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .queryParam("from", "2026-03-12")
        .queryParam("to", "2026-03-12")
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.appointments.length()").value(1))
      .andExpect(jsonPath("$.appointments[0].id").value(secondAppointmentId.toString()))
      .andExpect(jsonPath("$.receipts.length()").value(1))
      .andExpect(jsonPath("$.receipts[0].id").value(secondReceiptId.toString()))
      .andExpect(jsonPath("$.stats.totalVisits").value(0))
      .andExpect(jsonPath("$.stats.noShows").value(1))
      .andExpect(jsonPath("$.stats.totalSpend").value(0.0));

    mockMvc.perform(
      get("/api/v1/clients/{clientId}/history", clientId)
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .queryParam("limit", "1")
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.appointments.length()").value(1))
      .andExpect(jsonPath("$.receipts.length()").value(1));
  }

  @Test
  void returnsNotFoundForMissingClientAndValidationErrorsForInvalidRangeOrLimit() throws Exception {
    String adminToken = loginAndGetToken();

    mockMvc.perform(
      get("/api/v1/clients/{clientId}/history", UUID.randomUUID())
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
    )
      .andExpect(status().isNotFound())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("NOT_FOUND"));

    UUID clientId = createClient(adminToken, "Cliente Rango", "cliente-rango@example.com");

    mockMvc.perform(
      get("/api/v1/clients/{clientId}/history", clientId)
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .queryParam("from", "2026-03-13")
        .queryParam("to", "2026-03-12")
    )
      .andExpect(status().isBadRequest())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

    mockMvc.perform(
      get("/api/v1/clients/{clientId}/history", clientId)
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .queryParam("limit", "201")
    )
      .andExpect(status().isBadRequest())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
  }

  private UUID createService(String token, String name, int durationMinutes, BigDecimal price)
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

  private void patchAppointmentStatus(String token, UUID appointmentId, String statusValue)
    throws Exception {
    mockMvc.perform(
      patch("/api/v1/appointments/{appointmentId}", appointmentId)
        .header("Authorization", "Bearer " + token)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of("status", statusValue)))
    )
      .andExpect(status().isOk());
  }

  private UUID createReceipt(
    String token,
    UUID clientId,
    UUID serviceId,
    String description,
    BigDecimal total
  ) throws Exception {
    MvcResult mvcResult = mockMvc.perform(
      post("/api/v1/receipts")
        .header("Authorization", "Bearer " + token)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(receiptPayload(
          clientId,
          serviceId,
          description,
          total
        )))
    )
      .andExpect(status().isCreated())
      .andReturn();

    JsonNode payload = objectMapper.readTree(mvcResult.getResponse().getContentAsByteArray());
    return UUID.fromString(payload.get("id").asText());
  }

  private void voidReceipt(String token, UUID receiptId, String reason) throws Exception {
    mockMvc.perform(
      post("/api/v1/receipts/{receiptId}/void", receiptId)
        .header("Authorization", "Bearer " + token)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of("reason", reason)))
    )
      .andExpect(status().isOk());
  }

  private void updateReceiptIssuedAt(UUID receiptId, Instant issuedAt) {
    jdbcTemplate.update(
      """
      update receipts
      set issued_at = ?,
          updated_at = ?
      where tenant_id = ?
        and branch_id = ?
        and id = ?
      """,
      Timestamp.from(issuedAt),
      Timestamp.from(issuedAt),
      TENANT_ID,
      BRANCH_ID,
      receiptId
    );
  }

  private UUID seedBarberWithAccess(UUID barberId, String fullName, String email) {
    seedUserAndIssueToken(barberId, fullName, email, PASSWORD, "BARBER");
    grantBranchAccess(barberId, BRANCH_ID);
    seedDefaultBarberAvailability(barberId);
    return barberId;
  }

  private Map<String, Object> receiptPayload(
    UUID clientId,
    UUID serviceId,
    String description,
    BigDecimal total
  ) {
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("clientId", clientId);
    payload.put("discount", BigDecimal.ZERO.setScale(2));
    payload.put("tax", BigDecimal.ZERO.setScale(2));
    payload.put("items", List.of(Map.of(
      "serviceId",
      serviceId,
      "description",
      description,
      "quantity",
      1,
      "unitPrice",
      total
    )));
    payload.put("payments", List.of(Map.of(
      "method",
      "cash",
      "amount",
      total
    )));
    return payload;
  }
}

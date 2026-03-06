package com.barbersuite.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.barbersuite.backend.web.RequestHeaderNames;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.ZoneId;
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
class ReceiptsIntegrationTest extends AuthenticatedWebIntegrationTestSupport {

  private static final UUID RECEPTION_USER_ID = UUID.fromString(
    "aaaaaaa1-1111-7111-8111-aaaaaaaaaaa1"
  );
  private static final UUID BARBER_USER_ID = UUID.fromString(
    "bbbbbbb2-2222-7222-8222-bbbbbbbbbbb2"
  );

  @Test
  void adminCanCreateListGetAndVoidReceipts() throws Exception {
    String adminToken = loginAndGetToken();
    UUID serviceId = createService(adminToken, "Corte caja", 30, new BigDecimal("10.00"));
    UUID clientId = createClient(adminToken, "Cliente Caja", "cliente-caja@example.com");

    MvcResult createResult = mockMvc.perform(
      post("/api/v1/receipts")
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(receiptPayload(
          clientId,
          null,
          serviceId,
          "Corte caja",
          1,
          new BigDecimal("10.00"),
          new BigDecimal("0.00"),
          new BigDecimal("0.00"),
          "cash",
          new BigDecimal("10.00")
        )))
    )
      .andExpect(status().isCreated())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
      .andExpect(jsonPath("$.status").value("issued"))
      .andExpect(jsonPath("$.subtotal").value(10.0))
      .andExpect(jsonPath("$.discount").value(0.0))
      .andExpect(jsonPath("$.tax").value(0.0))
      .andExpect(jsonPath("$.total").value(10.0))
      .andExpect(jsonPath("$.items.length()").value(1))
      .andExpect(jsonPath("$.payments.length()").value(1))
      .andReturn();

    JsonNode createdReceipt = objectMapper.readTree(createResult.getResponse().getContentAsByteArray());
    UUID receiptId = UUID.fromString(createdReceipt.get("id").asText());
    int issuedYear = Instant.parse(createdReceipt.get("issuedAt").asText())
      .atZone(ZoneId.of(BRANCH_TIME_ZONE))
      .getYear();

    assertThat(createdReceipt.get("number").asText()).isEqualTo(
      "BR-%s-%d-000001".formatted(BRANCH_CODE, issuedYear)
    );

    mockMvc.perform(
      get("/api/v1/receipts/{receiptId}", receiptId)
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.id").value(receiptId.toString()))
      .andExpect(jsonPath("$.number").value(createdReceipt.get("number").asText()))
      .andExpect(jsonPath("$.items[0].description").value("Corte caja"))
      .andExpect(jsonPath("$.payments[0].method").value("cash"));

    mockMvc.perform(
      get("/api/v1/receipts")
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .queryParam("page", "0")
        .queryParam("size", "20")
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items[0].id").value(receiptId.toString()))
      .andExpect(jsonPath("$.totalItems").value(1))
      .andExpect(jsonPath("$.totalPages").value(1));

    mockMvc.perform(
      get("/api/v1/receipts/{receiptId}", UUID.randomUUID())
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
    )
      .andExpect(status().isNotFound())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("NOT_FOUND"));

    mockMvc.perform(
      post("/api/v1/receipts/{receiptId}/void", receiptId)
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of("reason", "Cobro reversado")))
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.id").value(receiptId.toString()))
      .andExpect(jsonPath("$.status").value("voided"));

    Map<String, Object> persistedReceipt = jdbcTemplate.queryForMap(
      """
      select status, void_reason, voided_at
      from receipts
      where tenant_id = ?
        and branch_id = ?
        and id = ?
      """,
      TENANT_ID,
      BRANCH_ID,
      receiptId
    );
    assertThat(persistedReceipt.get("status")).isEqualTo("voided");
    assertThat(persistedReceipt.get("void_reason")).isEqualTo("Cobro reversado");
    assertThat(persistedReceipt.get("voided_at")).isInstanceOf(Timestamp.class);

    mockMvc.perform(
      post("/api/v1/receipts/{receiptId}/void", receiptId)
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of("reason", "Segundo intento")))
    )
      .andExpect(status().isConflict())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("CONFLICT"));
  }

  @Test
  void returnsValidationErrorWhenPaymentsDoNotMatchTotal() throws Exception {
    String adminToken = loginAndGetToken();
    UUID serviceId = createService(adminToken, "Corte mismatch", 30, new BigDecimal("10.00"));
    UUID clientId = createClient(adminToken, "Cliente Mismatch", "cliente-mismatch@example.com");

    mockMvc.perform(
      post("/api/v1/receipts")
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(receiptPayload(
          clientId,
          null,
          serviceId,
          "Corte mismatch",
          1,
          new BigDecimal("10.00"),
          new BigDecimal("0.00"),
          new BigDecimal("0.00"),
          "cash",
          new BigDecimal("9.00")
        )))
    )
      .andExpect(status().isBadRequest())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
  }

  @Test
  void receptionCanCreateButCannotVoidAndBarberCannotReadReceipts() throws Exception {
    String adminToken = loginAndGetToken();
    String receptionToken = seedUserAndIssueToken(
      RECEPTION_USER_ID,
      "Rita Reception",
      "rita-reception@barbersuite.test",
      PASSWORD,
      "RECEPTION"
    );
    grantBranchAccess(RECEPTION_USER_ID, BRANCH_ID);

    String barberToken = seedUserAndIssueToken(
      BARBER_USER_ID,
      "Bruno Barber",
      "bruno-barber@barbersuite.test",
      PASSWORD,
      "BARBER"
    );
    grantBranchAccess(BARBER_USER_ID, BRANCH_ID);

    UUID serviceId = createService(adminToken, "Corte recepcion", 30, new BigDecimal("12.00"));
    UUID clientId = createClient(adminToken, "Cliente Recepcion", "cliente-recepcion@example.com");

    MvcResult receptionCreateResult = mockMvc.perform(
      post("/api/v1/receipts")
        .header("Authorization", "Bearer " + receptionToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(receiptPayload(
          clientId,
          null,
          serviceId,
          "Corte recepcion",
          1,
          new BigDecimal("12.00"),
          new BigDecimal("0.00"),
          new BigDecimal("0.00"),
          "card",
          new BigDecimal("12.00")
        )))
    )
      .andExpect(status().isCreated())
      .andReturn();

    UUID receiptId = UUID.fromString(
      objectMapper.readTree(receptionCreateResult.getResponse().getContentAsByteArray())
        .get("id")
        .asText()
    );

    mockMvc.perform(
      post("/api/v1/receipts/{receiptId}/void", receiptId)
        .header("Authorization", "Bearer " + receptionToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of("reason", "Reception cannot void")))
    )
      .andExpect(status().isForbidden())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("FORBIDDEN"));

    mockMvc.perform(
      get("/api/v1/receipts")
        .header("Authorization", "Bearer " + barberToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
    )
      .andExpect(status().isForbidden())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("FORBIDDEN"));
  }

  @Test
  void preventsSecondIssuedReceiptForSameAppointment() throws Exception {
    String adminToken = loginAndGetToken();
    UUID barberId = seedBarberWithAccess(
      UUID.fromString("ccccccc3-3333-7333-8333-ccccccccccc3"),
      "Barbero Caja",
      "barbero-caja@barbersuite.test"
    );
    UUID serviceId = createService(adminToken, "Corte cita", 30, new BigDecimal("14.00"));
    UUID clientId = createClient(adminToken, "Cliente Cita", "cliente-cita@example.com");
    UUID appointmentId = createAppointment(
      adminToken,
      clientId,
      barberId,
      serviceId,
      "2026-03-06T10:00"
    );

    mockMvc.perform(
      post("/api/v1/receipts")
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(receiptPayload(
          clientId,
          appointmentId,
          serviceId,
          "Corte cita",
          1,
          new BigDecimal("14.00"),
          new BigDecimal("0.00"),
          new BigDecimal("0.00"),
          "transfer",
          new BigDecimal("14.00")
        )))
    )
      .andExpect(status().isCreated());

    mockMvc.perform(
      post("/api/v1/receipts")
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(receiptPayload(
          clientId,
          appointmentId,
          serviceId,
          "Segundo cobro",
          1,
          new BigDecimal("14.00"),
          new BigDecimal("0.00"),
          new BigDecimal("0.00"),
          "cash",
          new BigDecimal("14.00")
        )))
    )
      .andExpect(status().isConflict())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("CONFLICT"));
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

  private UUID seedBarberWithAccess(UUID barberId, String fullName, String email) {
    seedUserAndIssueToken(barberId, fullName, email, PASSWORD, "BARBER");
    grantBranchAccess(barberId, BRANCH_ID);
    seedDefaultBarberAvailability(barberId);
    return barberId;
  }

  private Map<String, Object> receiptPayload(
    UUID clientId,
    UUID appointmentId,
    UUID serviceId,
    String description,
    int quantity,
    BigDecimal unitPrice,
    BigDecimal discount,
    BigDecimal tax,
    String paymentMethod,
    BigDecimal paymentAmount
  ) {
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("clientId", clientId);
    if (appointmentId != null) {
      payload.put("appointmentId", appointmentId);
    }
    payload.put("discount", discount);
    payload.put("tax", tax);
    payload.put("items", List.of(Map.of(
      "serviceId",
      serviceId,
      "description",
      description,
      "quantity",
      quantity,
      "unitPrice",
      unitPrice
    )));
    payload.put("payments", List.of(Map.of(
      "method",
      paymentMethod,
      "amount",
      paymentAmount
    )));
    return payload;
  }
}

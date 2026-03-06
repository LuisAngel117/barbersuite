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
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
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
class ReportsIntegrationTest extends AuthenticatedWebIntegrationTestSupport {

  private static final UUID RECEPTION_USER_ID = UUID.fromString(
    "ddddddd4-4444-7444-8444-ddddddddddd4"
  );

  @Test
  void returnsSalesSummaryUsingBranchLocalDateRange() throws Exception {
    String adminToken = loginAndGetToken();
    UUID serviceId = createService(adminToken, "Corte reportes summary", 30, new BigDecimal("18.00"));

    UUID issuedReceiptId = createReceipt(
      adminToken,
      null,
      null,
      serviceId,
      "Venta emitida",
      1,
      new BigDecimal("18.00"),
      new BigDecimal("0.00"),
      new BigDecimal("0.00"),
      "cash",
      new BigDecimal("18.00")
    );
    UUID voidedReceiptId = createReceipt(
      adminToken,
      null,
      null,
      serviceId,
      "Venta anulada",
      1,
      new BigDecimal("12.00"),
      new BigDecimal("0.00"),
      new BigDecimal("0.00"),
      "card",
      new BigDecimal("12.00")
    );

    setReceiptIssuedAt(issuedReceiptId, branchInstant("2026-03-10T23:30"));
    setReceiptIssuedAt(voidedReceiptId, branchInstant("2026-03-10T18:00"));
    voidReceipt(adminToken, voidedReceiptId, "Error de caja");

    mockMvc.perform(
      get("/api/v1/reports/sales/summary")
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .queryParam("from", "2026-03-10")
        .queryParam("to", "2026-03-10")
    )
      .andExpect(status().isOk())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
      .andExpect(jsonPath("$.from").value("2026-03-10"))
      .andExpect(jsonPath("$.to").value("2026-03-10"))
      .andExpect(jsonPath("$.currency").value("USD"))
      .andExpect(jsonPath("$.receiptsCount").value(1))
      .andExpect(jsonPath("$.voidedCount").value(1))
      .andExpect(jsonPath("$.grossSales").value(18.0))
      .andExpect(jsonPath("$.avgTicket").value(18.0))
      .andExpect(jsonPath("$.taxTotal").value(0.0))
      .andExpect(jsonPath("$.discountTotal").value(0.0));
  }

  @Test
  void returnsDailySalesIncludingZeroDays() throws Exception {
    String adminToken = loginAndGetToken();
    UUID serviceId = createService(adminToken, "Corte reportes daily", 30, new BigDecimal("20.00"));
    UUID receiptId = createReceipt(
      adminToken,
      null,
      null,
      serviceId,
      "Venta día medio",
      1,
      new BigDecimal("20.00"),
      new BigDecimal("0.00"),
      new BigDecimal("0.00"),
      "cash",
      new BigDecimal("20.00")
    );
    setReceiptIssuedAt(receiptId, branchInstant("2026-03-11T23:45"));

    MvcResult result = mockMvc.perform(
      get("/api/v1/reports/sales/daily")
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .queryParam("from", "2026-03-10")
        .queryParam("to", "2026-03-12")
    )
      .andExpect(status().isOk())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
      .andReturn();

    JsonNode payload = objectMapper.readTree(result.getResponse().getContentAsByteArray());
    assertThat(payload.get("currency").asText()).isEqualTo("USD");
    assertThat(payload.get("items")).hasSize(3);
    assertThat(payload.at("/items/0/date").asText()).isEqualTo("2026-03-10");
    assertThat(payload.at("/items/0/receiptsCount").asInt()).isZero();
    assertThat(payload.at("/items/0/grossSales").decimalValue()).isEqualByComparingTo("0.00");
    assertThat(payload.at("/items/1/date").asText()).isEqualTo("2026-03-11");
    assertThat(payload.at("/items/1/receiptsCount").asInt()).isEqualTo(1);
    assertThat(payload.at("/items/1/grossSales").decimalValue()).isEqualByComparingTo("20.00");
    assertThat(payload.at("/items/2/date").asText()).isEqualTo("2026-03-12");
    assertThat(payload.at("/items/2/receiptsCount").asInt()).isZero();
    assertThat(payload.at("/items/2/grossSales").decimalValue()).isEqualByComparingTo("0.00");
  }

  @Test
  void returnsTopServicesOrderedByRevenue() throws Exception {
    String adminToken = loginAndGetToken();
    UUID serviceAId = createService(adminToken, "Servicio A", 30, new BigDecimal("10.00"));
    UUID serviceBId = createService(adminToken, "Servicio B", 45, new BigDecimal("25.00"));

    UUID receiptOne = createReceipt(
      adminToken,
      null,
      null,
      serviceAId,
      "Servicio A",
      2,
      new BigDecimal("10.00"),
      new BigDecimal("0.00"),
      new BigDecimal("0.00"),
      "cash",
      new BigDecimal("20.00")
    );
    UUID receiptTwo = createReceipt(
      adminToken,
      null,
      null,
      serviceBId,
      "Servicio B",
      1,
      new BigDecimal("25.00"),
      new BigDecimal("0.00"),
      new BigDecimal("0.00"),
      "transfer",
      new BigDecimal("25.00")
    );
    UUID receiptThree = createReceipt(
      adminToken,
      null,
      null,
      serviceAId,
      "Servicio A",
      1,
      new BigDecimal("10.00"),
      new BigDecimal("0.00"),
      new BigDecimal("0.00"),
      "card",
      new BigDecimal("10.00")
    );

    Instant salesDay = branchInstant("2026-03-12T12:00");
    setReceiptIssuedAt(receiptOne, salesDay);
    setReceiptIssuedAt(receiptTwo, salesDay);
    setReceiptIssuedAt(receiptThree, salesDay);

    MvcResult result = mockMvc.perform(
      get("/api/v1/reports/services/top")
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .queryParam("from", "2026-03-12")
        .queryParam("to", "2026-03-12")
        .queryParam("limit", "10")
    )
      .andExpect(status().isOk())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
      .andReturn();

    JsonNode payload = objectMapper.readTree(result.getResponse().getContentAsByteArray());
    assertThat(payload.get("currency").asText()).isEqualTo("USD");
    assertThat(payload.get("items")).hasSize(2);
    assertThat(payload.at("/items/0/serviceId").asText()).isEqualTo(serviceAId.toString());
    assertThat(payload.at("/items/0/serviceName").asText()).isEqualTo("Servicio A");
    assertThat(payload.at("/items/0/quantity").asInt()).isEqualTo(3);
    assertThat(payload.at("/items/0/revenue").decimalValue()).isEqualByComparingTo("30.00");
    assertThat(payload.at("/items/1/serviceId").asText()).isEqualTo(serviceBId.toString());
    assertThat(payload.at("/items/1/quantity").asInt()).isEqualTo(1);
    assertThat(payload.at("/items/1/revenue").decimalValue()).isEqualByComparingTo("25.00");
  }

  @Test
  void returnsAppointmentsAndBarbersSummariesUsingBranchLocalRange() throws Exception {
    String adminToken = loginAndGetToken();
    UUID serviceId = createService(
      adminToken,
      "Servicio agenda reportes",
      30,
      new BigDecimal("15.00")
    );
    UUID clientOneId = createClient(adminToken, "Cliente Reporte Uno", "cliente-reporte-uno@example.com");
    UUID clientTwoId = createClient(adminToken, "Cliente Reporte Dos", "cliente-reporte-dos@example.com");
    UUID barberOneId = createBarber(
      adminToken,
      "Barbero Reporte Uno",
      "barbero-reporte-uno@example.com"
    );
    UUID barberTwoId = createBarber(
      adminToken,
      "Barbero Reporte Dos",
      "barbero-reporte-dos@example.com"
    );

    UUID appointmentOneId = createAppointment(
      adminToken,
      clientOneId,
      barberOneId,
      serviceId,
      "2026-03-10T23:30"
    );
    UUID appointmentTwoId = createAppointment(
      adminToken,
      clientTwoId,
      barberTwoId,
      serviceId,
      "2026-03-10T18:00"
    );

    patchAppointmentStatus(adminToken, appointmentOneId, "completed");
    patchAppointmentStatus(adminToken, appointmentTwoId, "no_show");

    mockMvc.perform(
      get("/api/v1/reports/appointments/summary")
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .queryParam("from", "2026-03-10")
        .queryParam("to", "2026-03-10")
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.from").value("2026-03-10"))
      .andExpect(jsonPath("$.to").value("2026-03-10"))
      .andExpect(jsonPath("$.scheduledCount").value(0))
      .andExpect(jsonPath("$.checkedInCount").value(0))
      .andExpect(jsonPath("$.completedCount").value(1))
      .andExpect(jsonPath("$.cancelledCount").value(0))
      .andExpect(jsonPath("$.noShowCount").value(1))
      .andExpect(jsonPath("$.bookedMinutes").value(30));

    MvcResult barbersResult = mockMvc.perform(
      get("/api/v1/reports/barbers/summary")
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .queryParam("from", "2026-03-10")
        .queryParam("to", "2026-03-10")
    )
      .andExpect(status().isOk())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
      .andReturn();

    JsonNode payload = objectMapper.readTree(barbersResult.getResponse().getContentAsByteArray());
    assertThat(payload.get("items")).hasSize(2);

    Map<String, JsonNode> itemsByBarberName = new LinkedHashMap<>();
    for (JsonNode item : payload.get("items")) {
      itemsByBarberName.put(item.get("barberName").asText(), item);
    }

    assertThat(itemsByBarberName.get("Barbero Reporte Uno")).isNotNull();
    assertThat(itemsByBarberName.get("Barbero Reporte Uno").get("appointmentsCount").asInt())
      .isEqualTo(1);
    assertThat(itemsByBarberName.get("Barbero Reporte Uno").get("completedCount").asInt())
      .isEqualTo(1);
    assertThat(itemsByBarberName.get("Barbero Reporte Uno").get("noShowCount").asInt())
      .isEqualTo(0);
    assertThat(itemsByBarberName.get("Barbero Reporte Uno").get("bookedMinutes").asInt())
      .isEqualTo(30);

    assertThat(itemsByBarberName.get("Barbero Reporte Dos")).isNotNull();
    assertThat(itemsByBarberName.get("Barbero Reporte Dos").get("appointmentsCount").asInt())
      .isEqualTo(1);
    assertThat(itemsByBarberName.get("Barbero Reporte Dos").get("completedCount").asInt())
      .isEqualTo(0);
    assertThat(itemsByBarberName.get("Barbero Reporte Dos").get("noShowCount").asInt())
      .isEqualTo(1);
    assertThat(itemsByBarberName.get("Barbero Reporte Dos").get("bookedMinutes").asInt())
      .isEqualTo(0);
  }

  @Test
  void receptionCannotAccessReports() throws Exception {
    String receptionToken = seedUserAndIssueToken(
      RECEPTION_USER_ID,
      "Rita Reports Reception",
      "rita-reports@barbersuite.test",
      PASSWORD,
      "RECEPTION"
    );
    grantBranchAccess(RECEPTION_USER_ID, BRANCH_ID);

    mockMvc.perform(
      get("/api/v1/reports/sales/summary")
        .header("Authorization", "Bearer " + receptionToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .queryParam("from", "2026-03-10")
        .queryParam("to", "2026-03-10")
    )
      .andExpect(status().isForbidden())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("FORBIDDEN"));
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
    UUID appointmentId,
    UUID serviceId,
    String description,
    int quantity,
    BigDecimal unitPrice,
    BigDecimal discount,
    BigDecimal tax,
    String paymentMethod,
    BigDecimal paymentAmount
  ) throws Exception {
    MvcResult mvcResult = mockMvc.perform(
      post("/api/v1/receipts")
        .header("Authorization", "Bearer " + token)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(receiptPayload(
          clientId,
          appointmentId,
          serviceId,
          description,
          quantity,
          unitPrice,
          discount,
          tax,
          paymentMethod,
          paymentAmount
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
    if (clientId != null) {
      payload.put("clientId", clientId);
    }
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

  private void setReceiptIssuedAt(UUID receiptId, Instant issuedAt) {
    jdbcTemplate.update(
      """
      update receipts
      set issued_at = ?,
          created_at = ?,
          updated_at = ?
      where tenant_id = ?
        and branch_id = ?
        and id = ?
      """,
      Timestamp.from(issuedAt),
      Timestamp.from(issuedAt),
      Timestamp.from(issuedAt),
      TENANT_ID,
      BRANCH_ID,
      receiptId
    );
  }

  private Instant branchInstant(String localDateTime) {
    return LocalDateTime.parse(localDateTime).atZone(ZoneId.of(BRANCH_TIME_ZONE)).toInstant();
  }
}

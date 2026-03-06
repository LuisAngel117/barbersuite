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
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class ClientsIntegrationTest extends AuthenticatedWebIntegrationTestSupport {

  @Test
  void returnsBranchRequiredWhenHeaderIsMissing() throws Exception {
    mockMvc.perform(
      get("/api/v1/clients")
        .header("Authorization", "Bearer " + loginAndGetToken())
    )
      .andExpect(status().isBadRequest())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("BRANCH_REQUIRED"));
  }

  @Test
  void returnsValidationErrorWhenBranchHeaderIsNotUuid() throws Exception {
    mockMvc.perform(
      get("/api/v1/clients")
        .header("Authorization", "Bearer " + loginAndGetToken())
        .header(RequestHeaderNames.BRANCH_ID, "not-a-uuid")
    )
      .andExpect(status().isBadRequest())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
      .andExpect(jsonPath("$.detail").value("Header X-Branch-Id must be a valid UUID."));
  }

  @Test
  void returnsBranchForbiddenWhenUserDoesNotHaveBranchAccess() throws Exception {
    UUID barberId = UUID.fromString("55555555-5555-7555-8555-555555555555");
    String barberToken = seedUserAndIssueToken(
      barberId,
      "Beto Barber",
      "barber-no-access@barbersuite.test",
      PASSWORD,
      "BARBER"
    );

    mockMvc.perform(
      get("/api/v1/clients")
        .header("Authorization", "Bearer " + barberToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
    )
      .andExpect(status().isForbidden())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.title").value("Branch forbidden"))
      .andExpect(jsonPath("$.code").value("BRANCH_FORBIDDEN"));
  }

  @Test
  void adminCanCreateListGetAndPatchClients() throws Exception {
    String adminToken = loginAndGetToken();

    MvcResult createResult = mockMvc.perform(
      post("/api/v1/clients")
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "fullName",
          "  Carlos Mendoza  ",
          "phone",
          "+593999123456",
          "email",
          "carlos@example.com",
          "notes",
          "Prefiere la tarde"
        )))
    )
      .andExpect(status().isCreated())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
      .andExpect(jsonPath("$.fullName").value("Carlos Mendoza"))
      .andExpect(jsonPath("$.phone").value("+593999123456"))
      .andExpect(jsonPath("$.email").value("carlos@example.com"))
      .andExpect(jsonPath("$.notes").value("Prefiere la tarde"))
      .andExpect(jsonPath("$.active").value(true))
      .andExpect(jsonPath("$.createdAt").isNotEmpty())
      .andReturn();

    JsonNode createdClient = objectMapper.readTree(createResult.getResponse().getContentAsByteArray());
    UUID clientId = UUID.fromString(createdClient.get("id").asText());
    Timestamp createdUpdatedAt = jdbcTemplate.queryForObject(
      """
      select updated_at
      from clients
      where tenant_id = ?
        and branch_id = ?
        and id = ?
      """,
      Timestamp.class,
      TENANT_ID,
      BRANCH_ID,
      clientId
    );

    MvcResult listResult = mockMvc.perform(
      get("/api/v1/clients")
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
    )
      .andExpect(status().isOk())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
      .andExpect(jsonPath("$.page").value(0))
      .andExpect(jsonPath("$.size").value(20))
      .andExpect(jsonPath("$.totalItems").value(1))
      .andExpect(jsonPath("$.totalPages").value(1))
      .andReturn();

    JsonNode listPayload = objectMapper.readTree(listResult.getResponse().getContentAsByteArray());
    assertThat(listPayload.get("items").isArray()).isTrue();
    assertThat(listPayload.get("items").size()).isEqualTo(1);
    assertThat(listPayload.get("items").get(0).get("id").asText()).isEqualTo(clientId.toString());
    assertThat(listPayload.get("items").get(0).get("fullName").asText()).isEqualTo("Carlos Mendoza");

    mockMvc.perform(
      get("/api/v1/clients/{clientId}", clientId)
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.id").value(clientId.toString()))
      .andExpect(jsonPath("$.fullName").value("Carlos Mendoza"))
      .andExpect(jsonPath("$.active").value(true));

    mockMvc.perform(
      patch("/api/v1/clients/{clientId}", clientId)
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "notes",
          "Cliente VIP",
          "email",
          "vip@example.com",
          "active",
          false
        )))
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.id").value(clientId.toString()))
      .andExpect(jsonPath("$.notes").value("Cliente VIP"))
      .andExpect(jsonPath("$.email").value("vip@example.com"))
      .andExpect(jsonPath("$.active").value(false));

    Map<String, Object> persistedClient = jdbcTemplate.queryForMap(
      """
      select full_name, phone, email, notes, active, updated_at
      from clients
      where tenant_id = ?
        and branch_id = ?
        and id = ?
      """,
      TENANT_ID,
      BRANCH_ID,
      clientId
    );

    assertThat(persistedClient.get("full_name")).isEqualTo("Carlos Mendoza");
    assertThat(persistedClient.get("phone")).isEqualTo("+593999123456");
    assertThat(persistedClient.get("email")).isEqualTo("vip@example.com");
    assertThat(persistedClient.get("notes")).isEqualTo("Cliente VIP");
    assertThat(persistedClient.get("active")).isEqualTo(false);
    assertThat((Timestamp) persistedClient.get("updated_at")).isAfterOrEqualTo(createdUpdatedAt);
  }

  @Test
  void barberCanReadAndCreateButCannotPatchClients() throws Exception {
    UUID barberId = UUID.fromString("66666666-6666-7666-8666-666666666666");
    String barberToken = seedUserAndIssueToken(
      barberId,
      "Pablo Barber",
      "barber-with-access@barbersuite.test",
      PASSWORD,
      "BARBER"
    );
    grantBranchAccess(barberId, BRANCH_ID);

    MvcResult createResult = mockMvc.perform(
      post("/api/v1/clients")
        .header("Authorization", "Bearer " + barberToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "fullName",
          "Lucia Ramos",
          "phone",
          "+593987654321"
        )))
    )
      .andExpect(status().isCreated())
      .andReturn();

    UUID clientId = UUID.fromString(
      objectMapper.readTree(createResult.getResponse().getContentAsByteArray()).get("id").asText()
    );

    mockMvc.perform(
      get("/api/v1/clients")
        .header("Authorization", "Bearer " + barberToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items[0].id").value(clientId.toString()));

    mockMvc.perform(
      get("/api/v1/clients/{clientId}", clientId)
        .header("Authorization", "Bearer " + barberToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.id").value(clientId.toString()));

    mockMvc.perform(
      patch("/api/v1/clients/{clientId}", clientId)
        .header("Authorization", "Bearer " + barberToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of("active", false)))
    )
      .andExpect(status().isForbidden())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("FORBIDDEN"));
  }

  @Test
  void returnsNotFoundWhenClientDoesNotExistForBranch() throws Exception {
    mockMvc.perform(
      get("/api/v1/clients/{clientId}", UUID.fromString("77777777-7777-7777-8777-777777777777"))
        .header("Authorization", "Bearer " + loginAndGetToken())
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
    )
      .andExpect(status().isNotFound())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("NOT_FOUND"));
  }

  @Test
  void returnsValidationErrorForEmptyPatch() throws Exception {
    String adminToken = loginAndGetToken();
    MvcResult createResult = mockMvc.perform(
      post("/api/v1/clients")
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of("fullName", "Mariana Leon")))
    )
      .andExpect(status().isCreated())
      .andReturn();

    UUID clientId = UUID.fromString(
      objectMapper.readTree(createResult.getResponse().getContentAsByteArray()).get("id").asText()
    );

    mockMvc.perform(
      patch("/api/v1/clients/{clientId}", clientId)
        .header("Authorization", "Bearer " + adminToken)
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
        .contentType(MediaType.APPLICATION_JSON)
        .content("{}")
    )
      .andExpect(status().isBadRequest())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
  }
}

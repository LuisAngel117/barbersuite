package com.barbersuite.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class BranchesAdminIntegrationTest extends AuthenticatedWebIntegrationTestSupport {

  @Test
  void adminCanCreateListGetAndPatchBranches() throws Exception {
    String adminToken = loginAndGetToken();

    MvcResult createResult = mockMvc.perform(
      post("/api/v1/branches")
        .header("Authorization", "Bearer " + adminToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "name",
          "Sucursal Norte",
          "code",
          "NTE01",
          "timeZone",
          "America/Bogota"
        )))
    )
      .andExpect(status().isCreated())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
      .andExpect(jsonPath("$.name").value("Sucursal Norte"))
      .andExpect(jsonPath("$.code").value("NTE01"))
      .andExpect(jsonPath("$.timeZone").value("America/Bogota"))
      .andExpect(jsonPath("$.active").value(true))
      .andReturn();

    JsonNode createdBranch = objectMapper.readTree(createResult.getResponse().getContentAsByteArray());
    UUID createdBranchId = UUID.fromString(createdBranch.get("id").asText());

    MvcResult listResult = mockMvc.perform(
      get("/api/v1/branches")
        .header("Authorization", "Bearer " + adminToken)
    )
      .andExpect(status().isOk())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
      .andReturn();

    JsonNode branches = objectMapper.readTree(listResult.getResponse().getContentAsByteArray());
    assertThat(branches.isArray()).isTrue();
    assertThat(branches.size()).isEqualTo(2);
    assertThat(containsBranch(branches, createdBranchId)).isTrue();

    mockMvc.perform(
      get("/api/v1/branches/{branchId}", createdBranchId)
        .header("Authorization", "Bearer " + adminToken)
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.id").value(createdBranchId.toString()))
      .andExpect(jsonPath("$.code").value("NTE01"))
      .andExpect(jsonPath("$.timeZone").value("America/Bogota"))
      .andExpect(jsonPath("$.active").value(true));

    mockMvc.perform(
      patch("/api/v1/branches/{branchId}", createdBranchId)
        .header("Authorization", "Bearer " + adminToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "name",
          "Sucursal Norte Renovada",
          "timeZone",
          "America/Guayaquil",
          "active",
          false
        )))
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.id").value(createdBranchId.toString()))
      .andExpect(jsonPath("$.name").value("Sucursal Norte Renovada"))
      .andExpect(jsonPath("$.code").value("NTE01"))
      .andExpect(jsonPath("$.timeZone").value("America/Guayaquil"))
      .andExpect(jsonPath("$.active").value(false));

    assertThat(jdbcTemplate.queryForObject(
      """
      select name
      from branches
      where tenant_id = ?
        and id = ?
      """,
      String.class,
      TENANT_ID,
      createdBranchId
    )).isEqualTo("Sucursal Norte Renovada");
    assertThat(jdbcTemplate.queryForObject(
      """
      select time_zone
      from branches
      where tenant_id = ?
        and id = ?
      """,
      String.class,
      TENANT_ID,
      createdBranchId
    )).isEqualTo("America/Guayaquil");
    assertThat(jdbcTemplate.queryForObject(
      """
      select active
      from branches
      where tenant_id = ?
        and id = ?
      """,
      Boolean.class,
      TENANT_ID,
      createdBranchId
    )).isFalse();
    assertThat(countRows(
      """
      select count(*)
      from user_branch_access
      where tenant_id = ?
        and user_id = ?
        and branch_id = ?
      """,
      TENANT_ID,
      USER_ID,
      createdBranchId
    )).isEqualTo(1);
  }

  @Test
  void returnsConflictWhenBranchCodeAlreadyExistsInTenant() throws Exception {
    String adminToken = loginAndGetToken();

    mockMvc.perform(
      post("/api/v1/branches")
        .header("Authorization", "Bearer " + adminToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "name",
          "Sucursal Sur",
          "code",
          BRANCH_CODE,
          "timeZone",
          BRANCH_TIME_ZONE
        )))
    )
      .andExpect(status().isConflict())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("CONFLICT"))
      .andExpect(jsonPath("$.instance").value("/api/v1/branches"));
  }

  @Test
  void barberCannotAccessTenantScopedBranchAdminEndpoints() throws Exception {
    UUID barberUserId = UUID.fromString("55555555-5555-7555-8555-555555555555");
    String barberToken = seedUserAndIssueToken(
      barberUserId,
      "Carlos Barber",
      "barber@barbersuite.test",
      PASSWORD,
      "BARBER"
    );

    mockMvc.perform(
      get("/api/v1/branches")
        .header("Authorization", "Bearer " + barberToken)
    )
      .andExpect(status().isForbidden())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("FORBIDDEN"));

    mockMvc.perform(
      post("/api/v1/branches")
        .header("Authorization", "Bearer " + barberToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "name",
          "Sucursal Oeste",
          "code",
          "OES01",
          "timeZone",
          "America/Guayaquil"
        )))
    )
      .andExpect(status().isForbidden())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("FORBIDDEN"));

    mockMvc.perform(
      patch("/api/v1/branches/{branchId}", BRANCH_ID)
        .header("Authorization", "Bearer " + barberToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of("active", false)))
    )
      .andExpect(status().isForbidden())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("FORBIDDEN"));
  }

  @Test
  void returnsNotFoundWhenBranchDoesNotExistForTenant() throws Exception {
    String adminToken = loginAndGetToken();

    mockMvc.perform(
      get("/api/v1/branches/{branchId}", UUID.fromString("66666666-6666-7666-8666-666666666666"))
        .header("Authorization", "Bearer " + adminToken)
    )
      .andExpect(status().isNotFound())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("NOT_FOUND"));
  }

  @Test
  void returnsValidationErrorWhenPatchPayloadIsEmpty() throws Exception {
    String adminToken = loginAndGetToken();

    mockMvc.perform(
      patch("/api/v1/branches/{branchId}", BRANCH_ID)
        .header("Authorization", "Bearer " + adminToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content("{}")
    )
      .andExpect(status().isBadRequest())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
  }

  private int countRows(String sql, Object... args) {
    Integer count = jdbcTemplate.queryForObject(sql, Integer.class, args);
    return count == null ? 0 : count;
  }

  private boolean containsBranch(JsonNode branches, UUID branchId) {
    for (JsonNode branch : branches) {
      if (branchId.toString().equals(branch.get("id").asText())) {
        return true;
      }
    }
    return false;
  }
}

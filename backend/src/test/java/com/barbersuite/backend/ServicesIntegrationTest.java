package com.barbersuite.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
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
class ServicesIntegrationTest extends AuthenticatedWebIntegrationTestSupport {

  @Test
  void adminCanCreateListGetAndPatchServices() throws Exception {
    String adminToken = loginAndGetToken();

    MvcResult createResult = mockMvc.perform(
      post("/api/v1/services")
        .header("Authorization", "Bearer " + adminToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "name",
          "  Corte clásico  ",
          "durationMinutes",
          45,
          "price",
          12.345
        )))
    )
      .andExpect(status().isCreated())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
      .andExpect(jsonPath("$.name").value("Corte clásico"))
      .andExpect(jsonPath("$.durationMinutes").value(45))
      .andExpect(jsonPath("$.price").value(12.35))
      .andExpect(jsonPath("$.active").value(true))
      .andReturn();

    JsonNode createdService = objectMapper.readTree(createResult.getResponse().getContentAsByteArray());
    UUID createdServiceId = UUID.fromString(createdService.get("id").asText());
    Timestamp createdUpdatedAt = jdbcTemplate.queryForObject(
      """
      select updated_at
      from services
      where tenant_id = ?
        and id = ?
      """,
      Timestamp.class,
      TENANT_ID,
      createdServiceId
    );

    MvcResult listResult = mockMvc.perform(
      get("/api/v1/services")
        .header("Authorization", "Bearer " + adminToken)
    )
      .andExpect(status().isOk())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
      .andReturn();

    JsonNode services = objectMapper.readTree(listResult.getResponse().getContentAsByteArray());
    assertThat(services.isArray()).isTrue();
    assertThat(services).anySatisfy(node -> {
      assertThat(node.get("id").asText()).isEqualTo(createdServiceId.toString());
      assertThat(node.get("name").asText()).isEqualTo("Corte clásico");
    });

    mockMvc.perform(
      get("/api/v1/services/{serviceId}", createdServiceId)
        .header("Authorization", "Bearer " + adminToken)
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.id").value(createdServiceId.toString()))
      .andExpect(jsonPath("$.name").value("Corte clásico"))
      .andExpect(jsonPath("$.durationMinutes").value(45))
      .andExpect(jsonPath("$.price").value(12.35))
      .andExpect(jsonPath("$.active").value(true));

    mockMvc.perform(
      patch("/api/v1/services/{serviceId}", createdServiceId)
        .header("Authorization", "Bearer " + adminToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "name",
          "Corte premium",
          "durationMinutes",
          60,
          "price",
          15.1,
          "active",
          false
        )))
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.id").value(createdServiceId.toString()))
      .andExpect(jsonPath("$.name").value("Corte premium"))
      .andExpect(jsonPath("$.durationMinutes").value(60))
      .andExpect(jsonPath("$.price").value(15.10))
      .andExpect(jsonPath("$.active").value(false));

    Map<String, Object> persistedService = jdbcTemplate.queryForMap(
      """
      select name, duration_minutes, price, active, updated_at
      from services
      where tenant_id = ?
        and id = ?
      """,
      TENANT_ID,
      createdServiceId
    );

    assertThat(persistedService.get("name")).isEqualTo("Corte premium");
    assertThat(persistedService.get("duration_minutes")).isEqualTo(60);
    assertThat(persistedService.get("price")).isEqualTo(new BigDecimal("15.10"));
    assertThat(persistedService.get("active")).isEqualTo(false);
    assertThat((Timestamp) persistedService.get("updated_at")).isAfterOrEqualTo(createdUpdatedAt);
  }

  @Test
  void returnsConflictWhenServiceNameAlreadyExistsIgnoringCase() throws Exception {
    String adminToken = loginAndGetToken();

    mockMvc.perform(
      post("/api/v1/services")
        .header("Authorization", "Bearer " + adminToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "name",
          "Corte",
          "durationMinutes",
          30,
          "price",
          8.00
        )))
    )
      .andExpect(status().isCreated());

    mockMvc.perform(
      post("/api/v1/services")
        .header("Authorization", "Bearer " + adminToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "name",
          "corte",
          "durationMinutes",
          35,
          "price",
          9.00
        )))
    )
      .andExpect(status().isConflict())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("CONFLICT"))
      .andExpect(jsonPath("$.instance").value("/api/v1/services"));
  }

  @Test
  void barberCanReadButCannotMutateServices() throws Exception {
    String adminToken = loginAndGetToken();

    MvcResult createResult = mockMvc.perform(
      post("/api/v1/services")
        .header("Authorization", "Bearer " + adminToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "name",
          "Barba",
          "durationMinutes",
          25,
          "price",
          7.00
        )))
    )
      .andExpect(status().isCreated())
      .andReturn();

    UUID serviceId = UUID.fromString(
      objectMapper.readTree(createResult.getResponse().getContentAsByteArray()).get("id").asText()
    );

    String barberToken = seedUserAndIssueToken(
      UUID.fromString("77777777-7777-7777-8777-777777777777"),
      "Carlos Barber",
      "barber-services@barbersuite.test",
      PASSWORD,
      "BARBER"
    );

    mockMvc.perform(
      get("/api/v1/services")
        .header("Authorization", "Bearer " + barberToken)
    )
      .andExpect(status().isOk())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));

    mockMvc.perform(
      get("/api/v1/services/{serviceId}", serviceId)
        .header("Authorization", "Bearer " + barberToken)
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.id").value(serviceId.toString()));

    mockMvc.perform(
      post("/api/v1/services")
        .header("Authorization", "Bearer " + barberToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "name",
          "Color",
          "durationMinutes",
          90,
          "price",
          25.00
        )))
    )
      .andExpect(status().isForbidden())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("FORBIDDEN"));

    mockMvc.perform(
      patch("/api/v1/services/{serviceId}", serviceId)
        .header("Authorization", "Bearer " + barberToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of("active", false)))
    )
      .andExpect(status().isForbidden())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("FORBIDDEN"));
  }

  @Test
  void returnsNotFoundWhenServiceDoesNotExistForTenant() throws Exception {
    String adminToken = loginAndGetToken();
    UUID missingServiceId = UUID.fromString("88888888-8888-7888-8888-888888888888");

    mockMvc.perform(
      get("/api/v1/services/{serviceId}", missingServiceId)
        .header("Authorization", "Bearer " + adminToken)
    )
      .andExpect(status().isNotFound())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("NOT_FOUND"));

    mockMvc.perform(
      patch("/api/v1/services/{serviceId}", missingServiceId)
        .header("Authorization", "Bearer " + adminToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of("active", false)))
    )
      .andExpect(status().isNotFound())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("NOT_FOUND"));
  }

  @Test
  void returnsValidationErrorForEmptyPatchAndInvalidCreatePayload() throws Exception {
    String adminToken = loginAndGetToken();

    mockMvc.perform(
      patch("/api/v1/services/{serviceId}", UUID.fromString("99999999-9999-7999-8999-999999999999"))
        .header("Authorization", "Bearer " + adminToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content("{}")
    )
      .andExpect(status().isBadRequest())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

    mockMvc.perform(
      post("/api/v1/services")
        .header("Authorization", "Bearer " + adminToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "name",
          "X",
          "durationMinutes",
          1,
          "price",
          -1
        )))
    )
      .andExpect(status().isBadRequest())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
  }
}

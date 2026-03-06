package com.barbersuite.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
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
class StaffAdminBarbersIntegrationTest extends AuthenticatedWebIntegrationTestSupport {

  private static final UUID BRANCH_TWO_ID = UUID.fromString("77777777-7777-7777-8777-777777777777");
  private static final UUID RECEPTION_USER_ID = UUID.fromString(
    "88888888-8888-7888-8888-888888888888"
  );

  @Test
  void adminCanCreateGetListPatchAndResetBarbers() throws Exception {
    String adminToken = loginAndGetToken();
    UUID branchTwoId = insertBranch(
      BRANCH_TWO_ID,
      "Sucursal Norte",
      "NTE01",
      "America/Bogota",
      true
    );
    UUID serviceId = createService(adminToken, "Corte premium", 45, "15.00");

    MvcResult createResult = mockMvc.perform(
      post("/api/v1/staff/barbers")
        .header("Authorization", "Bearer " + adminToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "fullName",
          "Diego Herrera",
          "email",
          "diego.staff@barbersuite.test",
          "phone",
          "+593999123456",
          "password",
          "Barber123!",
          "branchIds",
          List.of(BRANCH_ID, branchTwoId),
          "serviceIds",
          List.of(serviceId)
        )))
    )
      .andExpect(status().isCreated())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
      .andExpect(jsonPath("$.fullName").value("Diego Herrera"))
      .andExpect(jsonPath("$.email").value("diego.staff@barbersuite.test"))
      .andExpect(jsonPath("$.phone").value("+593999123456"))
      .andExpect(jsonPath("$.active").value(true))
      .andExpect(jsonPath("$.branches.length()").value(2))
      .andExpect(jsonPath("$.services.length()").value(1))
      .andReturn();

    JsonNode createdBarber = objectMapper.readTree(createResult.getResponse().getContentAsByteArray());
    UUID barberId = UUID.fromString(createdBarber.get("id").asText());

    mockMvc.perform(
      get("/api/v1/staff/barbers/{barberId}", barberId)
        .header("Authorization", "Bearer " + adminToken)
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.id").value(barberId.toString()))
      .andExpect(jsonPath("$.branches.length()").value(2))
      .andExpect(jsonPath("$.services.length()").value(1));

    mockMvc.perform(
      get("/api/v1/staff/barbers")
        .header("Authorization", "Bearer " + adminToken)
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items[0].id").value(barberId.toString()));

    mockMvc.perform(
      get("/api/v1/staff/barbers")
        .header("Authorization", "Bearer " + adminToken)
        .param("active", "true")
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items[0].id").value(barberId.toString()));

    mockMvc.perform(
      get("/api/v1/staff/barbers")
        .header("Authorization", "Bearer " + adminToken)
        .param("q", "Diego")
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items[0].id").value(barberId.toString()));

    mockMvc.perform(
      get("/api/v1/staff/barbers")
        .header("Authorization", "Bearer " + adminToken)
        .param("branchId", branchTwoId.toString())
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items[0].id").value(barberId.toString()));

    mockMvc.perform(
      patch("/api/v1/staff/barbers/{barberId}", barberId)
        .header("Authorization", "Bearer " + adminToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "branchIds",
          List.of(BRANCH_ID),
          "serviceIds",
          List.of(),
          "phone",
          "+593988000111"
        )))
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.branches.length()").value(1))
      .andExpect(jsonPath("$.branches[0].id").value(BRANCH_ID.toString()))
      .andExpect(jsonPath("$.services.length()").value(0))
      .andExpect(jsonPath("$.phone").value("+593988000111"));

    assertThat(countRows(
      """
      select count(*)
      from user_branch_access
      where tenant_id = ?
        and user_id = ?
      """,
      TENANT_ID,
      barberId
    )).isEqualTo(1);
    assertThat(countRows(
      """
      select count(*)
      from barber_services
      where tenant_id = ?
        and barber_id = ?
      """,
      TENANT_ID,
      barberId
    )).isEqualTo(0);

    mockMvc.perform(
      patch("/api/v1/staff/barbers/{barberId}", barberId)
        .header("Authorization", "Bearer " + adminToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "password",
          "NewPass123!"
        )))
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.id").value(barberId.toString()));

    mockMvc.perform(
      post("/api/v1/auth/login")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "email",
          "diego.staff@barbersuite.test",
          "password",
          "NewPass123!"
        )))
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.accessToken").isString());

    mockMvc.perform(
      patch("/api/v1/staff/barbers/{barberId}", barberId)
        .header("Authorization", "Bearer " + adminToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "active",
          false
        )))
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.active").value(false));

    MvcResult activeListResult = mockMvc.perform(
      get("/api/v1/staff/barbers")
        .header("Authorization", "Bearer " + adminToken)
        .param("active", "true")
    )
      .andExpect(status().isOk())
      .andReturn();

    JsonNode activeItems = objectMapper.readTree(
      activeListResult.getResponse().getContentAsByteArray()
    ).get("items");
    assertThat(containsBarber(activeItems, barberId)).isFalse();
  }

  @Test
  void returnsConflictWhenBarberEmailAlreadyExists() throws Exception {
    String adminToken = loginAndGetToken();

    mockMvc.perform(
      post("/api/v1/staff/barbers")
        .header("Authorization", "Bearer " + adminToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "fullName",
          "Diego Herrera",
          "email",
          EMAIL,
          "password",
          "Barber123!",
          "branchIds",
          List.of(BRANCH_ID)
        )))
    )
      .andExpect(status().isConflict())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("CONFLICT"));
  }

  @Test
  void receptionCannotAccessStaffAdminEndpoints() throws Exception {
    String receptionToken = seedUserAndIssueToken(
      RECEPTION_USER_ID,
      "Rita Reception",
      "reception.staff@barbersuite.test",
      PASSWORD,
      "RECEPTION"
    );

    mockMvc.perform(
      get("/api/v1/staff/barbers")
        .header("Authorization", "Bearer " + receptionToken)
    )
      .andExpect(status().isForbidden())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("FORBIDDEN"));

    mockMvc.perform(
      post("/api/v1/staff/barbers")
        .header("Authorization", "Bearer " + receptionToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "fullName",
          "Diego Herrera",
          "email",
          "another.staff@barbersuite.test",
          "password",
          "Barber123!",
          "branchIds",
          List.of(BRANCH_ID)
        )))
    )
      .andExpect(status().isForbidden())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.code").value("FORBIDDEN"));
  }

  private UUID createService(
    String adminToken,
    String name,
    int durationMinutes,
    String price
  ) throws Exception {
    MvcResult mvcResult = mockMvc.perform(
      post("/api/v1/services")
        .header("Authorization", "Bearer " + adminToken)
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

    JsonNode jsonNode = objectMapper.readTree(mvcResult.getResponse().getContentAsByteArray());
    return UUID.fromString(jsonNode.get("id").asText());
  }

  private UUID insertBranch(
    UUID branchId,
    String name,
    String code,
    String timeZone,
    boolean active
  ) {
    jdbcTemplate.update(
      """
      insert into branches (id, tenant_id, code, name, time_zone, active)
      values (?, ?, ?, ?, ?, ?)
      """,
      branchId,
      TENANT_ID,
      code,
      name,
      timeZone,
      active
    );
    return branchId;
  }

  private int countRows(String sql, Object... args) {
    Integer count = jdbcTemplate.queryForObject(sql, Integer.class, args);
    return count == null ? 0 : count;
  }

  private boolean containsBarber(JsonNode items, UUID barberId) {
    for (JsonNode item : items) {
      if (barberId.toString().equals(item.get("id").asText())) {
        return true;
      }
    }
    return false;
  }
}

package com.barbersuite.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class TenantsSignupIntegrationTest {

  private static final UUID EXISTING_TENANT_ID = UUID.fromString(
    "aaaaaaaa-aaaa-7aaa-8aaa-aaaaaaaaaaaa"
  );
  private static final UUID EXISTING_USER_ID = UUID.fromString(
    "bbbbbbbb-bbbb-7bbb-8bbb-bbbbbbbbbbbb"
  );

  @Autowired
  private WebApplicationContext webApplicationContext;

  @Autowired
  private JdbcTemplate jdbcTemplate;

  @Autowired
  private JwtDecoder jwtDecoder;

  private final ObjectMapper objectMapper = new ObjectMapper();

  private MockMvc mockMvc;

  @BeforeEach
  void setUp() {
    mockMvc = MockMvcBuilders
      .webAppContextSetup(webApplicationContext)
      .apply(springSecurity())
      .build();
    cleanDatabase();
  }

  @Test
  void signupCreatesTenantBranchUserRoleAndBranchAccess() throws Exception {
    MvcResult mvcResult = mockMvc.perform(
      post("/api/v1/tenants/signup")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(validSignupRequest(
          "OWNER@BARBERSUITE.TEST",
          "America/Guayaquil"
        )))
    )
      .andExpect(status().isCreated())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
      .andReturn();

    JsonNode jsonNode = objectMapper.readTree(mvcResult.getResponse().getContentAsByteArray());
    UUID tenantId = UUID.fromString(jsonNode.get("tenantId").asText());
    UUID branchId = UUID.fromString(jsonNode.get("branchId").asText());
    UUID userId = UUID.fromString(jsonNode.get("userId").asText());
    String accessToken = jsonNode.get("accessToken").asText();

    assertThat(accessToken).isNotBlank();
    assertThat(jsonNode.get("tokenType").asText()).isEqualTo("Bearer");
    assertThat(jsonNode.get("expiresIn").asInt()).isPositive();

    Jwt jwt = jwtDecoder.decode(accessToken);
    assertThat(jwt.getClaimAsString("tenantId")).isEqualTo(tenantId.toString());
    assertThat(jwt.getClaimAsString("userId")).isEqualTo(userId.toString());
    assertThat(jwt.getClaimAsStringList("roles")).containsExactly("ADMIN");

    assertThat(countRows("select count(*) from tenants where id = ?", tenantId)).isEqualTo(1);
    assertThat(countRows("select count(*) from branches where id = ? and tenant_id = ?", branchId, tenantId))
      .isEqualTo(1);
    assertThat(countRows("select count(*) from users where id = ? and tenant_id = ?", userId, tenantId))
      .isEqualTo(1);
    assertThat(jdbcTemplate.queryForObject(
      "select email from users where id = ?",
      String.class,
      userId
    )).isEqualTo("owner@barbersuite.test");
    assertThat(jdbcTemplate.queryForObject(
      "select full_name from users where id = ?",
      String.class,
      userId
    )).isEqualTo("Ana Perez");
    assertThat(jdbcTemplate.queryForObject(
      "select code from branches where id = ?",
      String.class,
      branchId
    )).isEqualTo("UIO01");
    assertThat(jdbcTemplate.queryForObject(
      "select active from branches where id = ?",
      Boolean.class,
      branchId
    )).isTrue();
    assertThat(countRows(
      """
      select count(*)
      from user_roles
      where tenant_id = ?
        and user_id = ?
        and role = 'ADMIN'
      """,
      tenantId,
      userId
    )).isEqualTo(1);
    assertThat(countRows(
      """
      select count(*)
      from user_branch_access
      where tenant_id = ?
        and user_id = ?
        and branch_id = ?
      """,
      tenantId,
      userId,
      branchId
    )).isEqualTo(1);
  }

  @Test
  void signupRejectsDuplicateAdminEmailAcrossTenants() throws Exception {
    seedExistingUser("owner@barbersuite.test");

    mockMvc.perform(
      post("/api/v1/tenants/signup")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(validSignupRequest(
          "OWNER@BARBERSUITE.TEST",
          "America/Guayaquil"
        )))
    )
      .andExpect(status().isConflict())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.code")
        .value("CONFLICT"))
      .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.instance")
        .value("/api/v1/tenants/signup"));
  }

  @Test
  void signupRejectsInvalidTimeZone() throws Exception {
    mockMvc.perform(
      post("/api/v1/tenants/signup")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(validSignupRequest(
          "owner@barbersuite.test",
          "Mars/Phobos"
        )))
    )
      .andExpect(status().isBadRequest())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.code")
        .value("VALIDATION_ERROR"))
      .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.instance")
        .value("/api/v1/tenants/signup"));
  }

  @Test
  void databaseRejectsDuplicateAdminEmailAcrossTenants() {
    seedExistingUser("owner@barbersuite.test");
    UUID anotherTenantId = UUID.fromString("cccccccc-cccc-7ccc-8ccc-cccccccccccc");
    UUID anotherUserId = UUID.fromString("dddddddd-dddd-7ddd-8ddd-dddddddddddd");

    jdbcTemplate.update(
      """
      insert into tenants (id, name)
      values (?, ?)
      """,
      anotherTenantId,
      "Another Tenant"
    );

    assertThatThrownBy(() -> jdbcTemplate.update(
      """
      insert into users (id, tenant_id, full_name, email, password_hash)
      values (?, ?, ?, ?, ?)
      """,
      anotherUserId,
      anotherTenantId,
      "Another Owner",
      "OWNER@BARBERSUITE.TEST",
      "$2a$10$anotherhashvalue"
    ))
      .isInstanceOf(DataIntegrityViolationException.class);
  }

  private Map<String, String> validSignupRequest(String adminEmail, String timeZone) {
    return Map.of(
      "tenantName",
      "BarberSuite Tenant",
      "branchName",
      "Sucursal Centro",
      "branchCode",
      "UIO01",
      "timeZone",
      timeZone,
      "adminFullName",
      "Ana Perez",
      "adminEmail",
      adminEmail,
      "adminPassword",
      "Admin123!"
    );
  }

  private void cleanDatabase() {
    jdbcTemplate.update("delete from appointments");
    jdbcTemplate.update("delete from user_branch_access");
    jdbcTemplate.update("delete from user_roles");
    jdbcTemplate.update("delete from receipt_sequences");
    jdbcTemplate.update("delete from clients");
    jdbcTemplate.update("delete from services");
    jdbcTemplate.update("delete from users");
    jdbcTemplate.update("delete from branches");
    jdbcTemplate.update("delete from tenants");
  }

  private void seedExistingUser(String email) {
    jdbcTemplate.update(
      """
      insert into tenants (id, name)
      values (?, ?)
      """,
      EXISTING_TENANT_ID,
      "Existing Tenant"
    );
    jdbcTemplate.update(
      """
      insert into users (id, tenant_id, full_name, email, password_hash)
      values (?, ?, ?, ?, ?)
      """,
      EXISTING_USER_ID,
      EXISTING_TENANT_ID,
      "Existing Owner",
      email,
      "$2a$10$existinghashvalue"
    );
  }

  private int countRows(String sql, Object... args) {
    Integer count = jdbcTemplate.queryForObject(sql, Integer.class, args);
    return count == null ? 0 : count;
  }
}

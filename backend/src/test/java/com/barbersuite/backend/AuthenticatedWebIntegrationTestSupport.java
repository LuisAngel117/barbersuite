package com.barbersuite.backend;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.barbersuite.backend.auth.AuthUser;
import com.barbersuite.backend.auth.JwtTokenService;
import java.util.Map;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

abstract class AuthenticatedWebIntegrationTestSupport {

  protected static final UUID TENANT_ID = UUID.fromString("11111111-1111-7111-8111-111111111111");
  protected static final UUID BRANCH_ID = UUID.fromString("22222222-2222-7222-8222-222222222222");
  protected static final UUID USER_ID = UUID.fromString("33333333-3333-7333-8333-333333333333");
  protected static final UUID USER_BRANCH_ACCESS_ID = UUID.fromString(
    "44444444-4444-7444-8444-444444444444"
  );
  protected static final String TENANT_NAME = "BarberSuite Test Tenant";
  protected static final String BRANCH_CODE = "UIO";
  protected static final String BRANCH_NAME = "Sucursal UIO";
  protected static final String BRANCH_TIME_ZONE = "America/Guayaquil";
  protected static final String FULL_NAME = "Ana Admin";
  protected static final String EMAIL = "admin@barbersuite.test";
  protected static final String PASSWORD = "Admin123!";

  @Autowired
  private WebApplicationContext webApplicationContext;

  @Autowired
  protected JdbcTemplate jdbcTemplate;

  @Autowired
  private PasswordEncoder passwordEncoder;

  @Autowired
  private JwtTokenService jwtTokenService;

  protected final ObjectMapper objectMapper = new ObjectMapper();
  protected MockMvc mockMvc;

  @BeforeEach
  void setUpAuthenticatedSupport() {
    mockMvc = MockMvcBuilders
      .webAppContextSetup(webApplicationContext)
      .apply(springSecurity())
      .build();
    reseedAuthData();
  }

  protected String loginAndGetToken() throws Exception {
    MvcResult mvcResult = mockMvc.perform(
      MockMvcRequestBuilders.post("/api/v1/auth/login")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "email",
          EMAIL,
          "password",
          PASSWORD
        )))
    )
      .andExpect(status().isOk())
      .andReturn();

    JsonNode jsonNode = objectMapper.readTree(mvcResult.getResponse().getContentAsByteArray());
    return jsonNode.get("accessToken").asText();
  }

  protected String seedUserAndIssueToken(
    UUID userId,
    String fullName,
    String email,
    String password,
    String role
  ) {
    jdbcTemplate.update(
      """
      insert into users (id, tenant_id, full_name, email, password_hash)
      values (?, ?, ?, ?, ?)
      """,
      userId,
      TENANT_ID,
      fullName,
      email,
      passwordEncoder.encode(password)
    );

    jdbcTemplate.update(
      """
      insert into user_roles (tenant_id, user_id, role)
      values (?, ?, ?)
      """,
      TENANT_ID,
      userId,
      role
    );

    return jwtTokenService.issueToken(new AuthUser(
      TENANT_ID,
      userId,
      email,
      "",
      List.of(role)
    ));
  }

  protected void grantBranchAccess(UUID userId, UUID branchId) {
    jdbcTemplate.update(
      """
      insert into user_branch_access (id, tenant_id, user_id, branch_id)
      values (?, ?, ?, ?)
      """,
      UUID.randomUUID(),
      TENANT_ID,
      userId,
      branchId
    );
  }

  private void reseedAuthData() {
    jdbcTemplate.update("delete from user_branch_access");
    jdbcTemplate.update("delete from user_roles");
    jdbcTemplate.update("delete from receipt_sequences");
    jdbcTemplate.update("delete from clients");
    jdbcTemplate.update("delete from services");
    jdbcTemplate.update("delete from users");
    jdbcTemplate.update("delete from branches");
    jdbcTemplate.update("delete from tenants");

    jdbcTemplate.update(
      """
      insert into tenants (id, name)
      values (?, ?)
      """,
      TENANT_ID,
      "BarberSuite Test Tenant"
    );

    jdbcTemplate.update(
      """
      insert into branches (id, tenant_id, code, name, time_zone, active)
      values (?, ?, ?, ?, ?, ?)
      """,
      BRANCH_ID,
      TENANT_ID,
      BRANCH_CODE,
      BRANCH_NAME,
      BRANCH_TIME_ZONE,
      true
    );

    jdbcTemplate.update(
      """
      insert into users (id, tenant_id, full_name, email, password_hash)
      values (?, ?, ?, ?, ?)
      """,
      USER_ID,
      TENANT_ID,
      FULL_NAME,
      EMAIL,
      passwordEncoder.encode(PASSWORD)
    );

    jdbcTemplate.update(
      """
      insert into user_roles (tenant_id, user_id, role)
      values (?, ?, ?)
      """,
      TENANT_ID,
      USER_ID,
      "ADMIN"
    );

    jdbcTemplate.update(
      """
      insert into user_branch_access (id, tenant_id, user_id, branch_id)
      values (?, ?, ?, ?)
      """,
      USER_BRANCH_ACCESS_ID,
      TENANT_ID,
      USER_ID,
      BRANCH_ID
    );
  }
}

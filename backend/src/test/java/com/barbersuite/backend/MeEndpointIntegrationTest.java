package com.barbersuite.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class MeEndpointIntegrationTest extends AuthenticatedWebIntegrationTestSupport {

  @Autowired
  private JwtDecoder jwtDecoder;

  @Test
  void returnsCurrentIdentityAndAccessibleBranches() throws Exception {
    String token = loginAndGetToken();
    Jwt jwt = jwtDecoder.decode(token);

    mockMvc.perform(
      get("/api/v1/me")
        .header("Authorization", "Bearer " + token)
    )
      .andExpect(status().isOk())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
      .andExpect(jsonPath("$.tenant.id").value(jwt.getClaimAsString("tenantId")))
      .andExpect(jsonPath("$.tenant.name").value(TENANT_NAME))
      .andExpect(jsonPath("$.user.id").value(jwt.getClaimAsString("userId")))
      .andExpect(jsonPath("$.user.fullName").value(FULL_NAME))
      .andExpect(jsonPath("$.user.email").value(EMAIL))
      .andExpect(jsonPath("$.user.roles[0]").value("ADMIN"))
      .andExpect(jsonPath("$.branches[0].id").value(BRANCH_ID.toString()))
      .andExpect(jsonPath("$.branches[0].name").value(BRANCH_NAME))
      .andExpect(jsonPath("$.branches[0].code").value(BRANCH_CODE))
      .andExpect(jsonPath("$.branches[0].timeZone").value(BRANCH_TIME_ZONE))
      .andExpect(jsonPath("$.branches[0].active").value(true));
  }

  @Test
  void returnsUnauthorizedWhenAuthorizationHeaderIsMissing() throws Exception {
    mockMvc.perform(get("/api/v1/me"))
      .andExpect(status().isUnauthorized());
  }

  @Test
  void returnsEmptyBranchesWhenUserHasNoBranchAccess() throws Exception {
    String token = loginAndGetToken();
    jdbcTemplate.update(
      """
      delete from user_branch_access
      where tenant_id = ?
        and user_id = ?
      """,
      TENANT_ID,
      USER_ID
    );

    mockMvc.perform(
      get("/api/v1/me")
        .header("Authorization", "Bearer " + token)
    )
      .andExpect(status().isOk())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
      .andExpect(jsonPath("$.tenant.id").value(TENANT_ID.toString()))
      .andExpect(jsonPath("$.user.id").value(USER_ID.toString()))
      .andExpect(jsonPath("$.branches").isArray())
      .andExpect(jsonPath("$.branches").isEmpty());
  }
}

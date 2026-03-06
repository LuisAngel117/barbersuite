package com.barbersuite.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
class JwtAuthenticationIntegrationTest extends AuthenticatedWebIntegrationTestSupport {

  @Autowired
  private JwtDecoder jwtDecoder;

  @Test
  void loginReturnsTokenWithExpectedClaims() throws Exception {
    String token = loginAndGetToken();

    Jwt jwt = jwtDecoder.decode(token);

    assertThat(jwt.getClaimAsString("tenantId")).isEqualTo(TENANT_ID.toString());
    assertThat(jwt.getClaimAsString("userId")).isEqualTo(USER_ID.toString());
    assertThat(jwt.getClaimAsStringList("roles")).containsExactly("ADMIN");
    assertThat(jdbcTemplate.queryForObject(
      "select tenant_id::text from users where id = ?",
      String.class,
      USER_ID
    )).isEqualTo(jwt.getClaimAsString("tenantId"));
  }

  @Test
  void loginAcceptsEmailAndPasswordWithoutTenantId() throws Exception {
    mockMvc.perform(
      post("/api/v1/auth/login")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(java.util.Map.of(
          "email",
          EMAIL,
          "password",
          PASSWORD
        )))
    )
      .andExpect(status().isOk())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
      .andExpect(jsonPath("$.accessToken").isString())
      .andExpect(jsonPath("$.tokenType").value("Bearer"))
      .andExpect(jsonPath("$.expiresIn").isNumber());
  }

  @Test
  void protectedEndpointRequiresTokenAndReadsTenantContext() throws Exception {
    mockMvc.perform(get("/api/v1/_debug/protected"))
      .andExpect(status().isUnauthorized());

    mockMvc.perform(
      get("/api/v1/_debug/protected")
        .header("Authorization", "Bearer " + loginAndGetToken())
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.tenantId").value(TENANT_ID.toString()))
      .andExpect(jsonPath("$.userId").value(USER_ID.toString()))
      .andExpect(jsonPath("$.roles[0]").value("ADMIN"));
  }
}

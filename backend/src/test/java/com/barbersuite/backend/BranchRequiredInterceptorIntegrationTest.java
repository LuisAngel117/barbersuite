package com.barbersuite.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.barbersuite.backend.web.RequestHeaderNames;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class BranchRequiredInterceptorIntegrationTest extends AuthenticatedWebIntegrationTestSupport {

  @Test
  void returnsProblemDetailsWhenBranchHeaderIsMissing() throws Exception {
    mockMvc.perform(
      get("/api/v1/_debug/branch-required")
        .header("Authorization", "Bearer " + loginAndGetToken())
    )
      .andExpect(status().isBadRequest())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.status").value(400))
      .andExpect(jsonPath("$.title").value("Bad Request"))
      .andExpect(jsonPath("$.detail").value("Header X-Branch-Id is required for this endpoint."))
      .andExpect(jsonPath("$.code").value("BRANCH_REQUIRED"))
      .andExpect(jsonPath("$.instance").value("/api/v1/_debug/branch-required"));
  }

  @Test
  void returnsOkWhenBranchHeaderIsPresent() throws Exception {
    mockMvc.perform(
      get("/api/v1/_debug/branch-required")
        .header("Authorization", "Bearer " + loginAndGetToken())
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.branchId").value(BRANCH_ID.toString()));
  }
}

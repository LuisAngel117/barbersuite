package com.barbersuite.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.barbersuite.backend.web.RequestHeaderNames;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class BranchRequiredInterceptorIntegrationTest {

  @Autowired
  private WebApplicationContext webApplicationContext;

  private MockMvc mockMvc;

  @BeforeEach
  void setUp() {
    mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
  }

  @Test
  void returnsProblemDetailsWhenBranchHeaderIsMissing() throws Exception {
    mockMvc.perform(get("/api/v1/_debug/branch-required"))
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
    UUID branchId = UUID.randomUUID();

    mockMvc.perform(
      get("/api/v1/_debug/branch-required")
        .header(RequestHeaderNames.BRANCH_ID, branchId.toString())
    )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.branchId").value(branchId.toString()));
  }
}

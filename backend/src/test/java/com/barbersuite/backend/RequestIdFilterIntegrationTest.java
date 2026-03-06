package com.barbersuite.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.barbersuite.backend.web.RequestHeaderNames;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class RequestIdFilterIntegrationTest extends AuthenticatedWebIntegrationTestSupport {

  @Test
  void generatesRequestIdWhenRequestHeaderIsMissing() throws Exception {
    MvcResult result = mockMvc.perform(get("/actuator/health"))
      .andExpect(status().isOk())
      .andExpect(header().exists(RequestHeaderNames.REQUEST_ID))
      .andReturn();

    assertThat(result.getResponse().getHeader(RequestHeaderNames.REQUEST_ID)).isNotBlank();
  }

  @Test
  void propagatesRequestIdWhenHeaderIsPresent() throws Exception {
    mockMvc.perform(
      get("/actuator/health")
        .header(RequestHeaderNames.REQUEST_ID, "test-123")
    )
      .andExpect(status().isOk())
      .andExpect(header().string(RequestHeaderNames.REQUEST_ID, "test-123"));
  }

  @Test
  void returnsValidationErrorWhenRequestIdHeaderIsInvalid() throws Exception {
    mockMvc.perform(
      get("/actuator/health")
        .header(RequestHeaderNames.REQUEST_ID, "x".repeat(101))
    )
      .andExpect(status().isBadRequest())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(header().exists(RequestHeaderNames.REQUEST_ID))
      .andExpect(jsonPath("$.status").value(400))
      .andExpect(jsonPath("$.title").value("Bad Request"))
      .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
      .andExpect(jsonPath("$.instance").value("/actuator/health"));
  }

  @Test
  void addsRequestIdToUnauthorizedResponses() throws Exception {
    mockMvc.perform(get("/api/v1/me"))
      .andExpect(status().isUnauthorized())
      .andExpect(header().exists(RequestHeaderNames.REQUEST_ID));
  }
}

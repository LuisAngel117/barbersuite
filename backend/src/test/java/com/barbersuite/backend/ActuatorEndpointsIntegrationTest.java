package com.barbersuite.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MvcResult;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class ActuatorEndpointsIntegrationTest extends AuthenticatedWebIntegrationTestSupport {

  @Test
  void healthEndpointIsAvailable() throws Exception {
    MvcResult result = mockMvc.perform(get("/actuator/health"))
      .andExpect(status().isOk())
      .andReturn();

    assertThat(result.getResponse().getContentType()).contains("json");
  }

  @Test
  void prometheusEndpointIsAvailable() throws Exception {
    MvcResult result = mockMvc.perform(get("/actuator/prometheus"))
      .andExpect(status().isOk())
      .andReturn();

    String body = result.getResponse().getContentAsString();
    assertThat(body).contains("# HELP");
    assertThat(body).contains("jvm_");
  }
}

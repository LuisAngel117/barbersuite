package com.barbersuite.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class ObservabilityMetricsIntegrationTest extends AuthenticatedWebIntegrationTestSupport {

  @Test
  void incrementsServiceCreationCounterAfterSuccessfulCreate() throws Exception {
    double before = prometheusCounterValue("barbersuite_service_creations_total");

    mockMvc.perform(
      post("/api/v1/services")
        .header("Authorization", "Bearer " + loginAndGetToken())
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsBytes(Map.of(
          "name",
          "Corte observability",
          "durationMinutes",
          30,
          "price",
          10.00
        )))
    )
      .andExpect(status().isCreated());

    double after = prometheusCounterValue("barbersuite_service_creations_total");
    assertThat(after).isCloseTo(before + 1.0d, within(0.0001d));
  }

  @Test
  void incrementsBranchRequiredCounterWhenHeaderIsMissing() throws Exception {
    double before = prometheusCounterValue("barbersuite_branch_required_total");

    mockMvc.perform(
      get("/api/v1/clients")
        .header("Authorization", "Bearer " + loginAndGetToken())
    )
      .andExpect(status().isBadRequest());

    double after = prometheusCounterValue("barbersuite_branch_required_total");
    assertThat(after).isCloseTo(before + 1.0d, within(0.0001d));
  }

  private double prometheusCounterValue(String metricName) throws Exception {
    String body = mockMvc.perform(get("/actuator/prometheus"))
      .andExpect(status().isOk())
      .andReturn()
      .getResponse()
      .getContentAsString();

    Pattern pattern = Pattern.compile(
      "(?m)^" + Pattern.quote(metricName) + "(?:\\{[^}]*\\})?\\s+([0-9.eE+-]+)$"
    );
    Matcher matcher = pattern.matcher(body);
    assertThat(matcher.find())
      .as("Expected metric %s to be present in /actuator/prometheus", metricName)
      .isTrue();
    return Double.parseDouble(matcher.group(1));
  }
}

package com.barbersuite.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.barbersuite.backend.web.RequestHeaderNames;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class BarbersIntegrationTest extends AuthenticatedWebIntegrationTestSupport {

  @Test
  void returnsBarbersWithAccessToCurrentBranch() throws Exception {
    UUID barberId = UUID.fromString("aaaaaaaa-bbbb-7ccc-8ddd-eeeeeeeeeeee");
    seedUserAndIssueToken(
      barberId,
      "Diego Barber",
      "diego-barber@barbersuite.test",
      PASSWORD,
      "BARBER"
    );
    grantBranchAccess(barberId, BRANCH_ID);

    mockMvc.perform(
      get("/api/v1/barbers")
        .header("Authorization", "Bearer " + loginAndGetToken())
        .header(RequestHeaderNames.BRANCH_ID, BRANCH_ID.toString())
    )
      .andExpect(status().isOk())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
      .andExpect(jsonPath("$.items[0].id").value(barberId.toString()))
      .andExpect(jsonPath("$.items[0].fullName").value("Diego Barber"))
      .andExpect(jsonPath("$.items[0].active").value(true));
  }
}

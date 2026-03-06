package com.barbersuite.backend.staffadmin;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcStaffServicesRepositoryLite {

  private final JdbcTemplate jdbcTemplate;

  public JdbcStaffServicesRepositoryLite(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public boolean allExistForTenant(UUID tenantId, List<UUID> serviceIds) {
    if (serviceIds.isEmpty()) {
      return true;
    }

    String placeholders = String.join(", ", Collections.nCopies(serviceIds.size(), "?"));
    List<Object> arguments = new ArrayList<>();
    arguments.add(tenantId);
    arguments.addAll(serviceIds);

    Long count = jdbcTemplate.queryForObject(
      """
      select count(distinct id)
      from services
      where tenant_id = ?
        and id in (%s)
      """.formatted(placeholders),
      Long.class,
      arguments.toArray()
    );
    return count != null && count == serviceIds.size();
  }
}

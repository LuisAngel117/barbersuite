package com.barbersuite.backend.staffadmin;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcStaffBarberBranchesRepository {

  private static final RowMapper<AssignedBranchRow> ASSIGNED_BRANCH_ROW_MAPPER =
    JdbcStaffBarberBranchesRepository::mapAssignedBranchRow;

  private final JdbcTemplate jdbcTemplate;

  public JdbcStaffBarberBranchesRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public void replaceBranches(UUID tenantId, UUID barberId, List<UUID> branchIds) {
    jdbcTemplate.update(
      """
      delete from user_branch_access
      where tenant_id = ?
        and user_id = ?
      """,
      tenantId,
      barberId
    );

    for (UUID branchId : branchIds) {
      jdbcTemplate.update(
        """
        insert into user_branch_access (id, tenant_id, user_id, branch_id)
        values (?, ?, ?, ?)
        """,
        UUID.randomUUID(),
        tenantId,
        barberId,
        branchId
      );
    }
  }

  public Map<UUID, List<AssignedBranchRow>> listBranchesForBarbers(UUID tenantId, List<UUID> barberIds) {
    if (barberIds.isEmpty()) {
      return Collections.emptyMap();
    }

    String placeholders = String.join(", ", Collections.nCopies(barberIds.size(), "?"));
    List<Object> arguments = new ArrayList<>();
    arguments.add(tenantId);
    arguments.addAll(barberIds);

    List<AssignedBranchRow> rows = jdbcTemplate.query(
      """
      select uba.user_id, b.id, b.name, b.code, b.active
      from user_branch_access uba
      join branches b
        on b.tenant_id = uba.tenant_id
       and b.id = uba.branch_id
      where uba.tenant_id = ?
        and uba.user_id in (%s)
      order by b.code asc
      """.formatted(placeholders),
      ASSIGNED_BRANCH_ROW_MAPPER,
      arguments.toArray()
    );

    Map<UUID, List<AssignedBranchRow>> result = new LinkedHashMap<>();
    for (AssignedBranchRow row : rows) {
      result.computeIfAbsent(row.barberId(), ignored -> new ArrayList<>()).add(row);
    }
    return result;
  }

  private static AssignedBranchRow mapAssignedBranchRow(ResultSet resultSet, int rowNum)
    throws SQLException {
    return new AssignedBranchRow(
      resultSet.getObject("user_id", UUID.class),
      resultSet.getObject("id", UUID.class),
      resultSet.getString("name"),
      resultSet.getString("code"),
      resultSet.getBoolean("active")
    );
  }

  public record AssignedBranchRow(
    UUID barberId,
    UUID id,
    String name,
    String code,
    boolean active
  ) {
  }
}

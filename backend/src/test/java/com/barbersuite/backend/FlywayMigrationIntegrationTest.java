package com.barbersuite.backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.PostgreSQLContainer;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class FlywayMigrationIntegrationTest {

  @Autowired
  private JdbcTemplate jdbcTemplate;

  @Autowired
  private Flyway flyway;

  @Autowired
  private PostgreSQLContainer<?> postgresContainer;

  @Test
  void appliesLatestMigrationOnRealPostgres() {
    assertThat(postgresContainer.isRunning()).isTrue();
    assertThat(jdbcTemplate.queryForObject("select version()", String.class))
      .contains("PostgreSQL");
    assertThat(flyway.info().current()).isNotNull();
    assertThat(flyway.info().current().getVersion().getVersion()).isEqualTo("2");

    assertThat(List.of("tenants", "branches", "users", "receipt_sequences", "user_roles"))
      .allMatch(this::tableExists);
    assertThat(columnType("tenants", "id")).isEqualTo("uuid");
    assertThat(columnType("branches", "id")).isEqualTo("uuid");
    assertThat(columnType("users", "id")).isEqualTo("uuid");
    assertThat(columnType("receipt_sequences", "id")).isEqualTo("uuid");
    assertThat(columnType("user_roles", "tenant_id")).isEqualTo("uuid");
    assertThat(columnType("user_roles", "user_id")).isEqualTo("uuid");

    assertThat(constraintExists("branches", "uq_branches_tenant_code", "UNIQUE")).isTrue();
    assertThat(constraintExists("users", "uq_users_tenant_email", "UNIQUE")).isTrue();
    assertThat(constraintExists("users", "uq_users_tenant_user", "UNIQUE")).isTrue();
    assertThat(constraintExists(
      "receipt_sequences",
      "uq_receipt_sequences_tenant_branch_year",
      "UNIQUE"
    )).isTrue();
    assertThat(constraintExists(
      "user_roles",
      "uq_user_roles_tenant_user_role",
      "UNIQUE"
    )).isTrue();
    assertThat(constraintExists("branches", "fk_branches_tenant", "FOREIGN KEY")).isTrue();
    assertThat(constraintExists("users", "fk_users_tenant", "FOREIGN KEY")).isTrue();
    assertThat(constraintExists(
      "receipt_sequences",
      "fk_receipt_sequences_branch",
      "FOREIGN KEY"
    )).isTrue();
    assertThat(constraintExists("user_roles", "fk_user_roles_tenant", "FOREIGN KEY")).isTrue();
    assertThat(constraintExists("user_roles", "fk_user_roles_user", "FOREIGN KEY")).isTrue();
  }

  private boolean tableExists(String tableName) {
    return Boolean.TRUE.equals(jdbcTemplate.queryForObject(
      """
      select exists (
        select 1
        from information_schema.tables
        where table_schema = 'public'
          and table_name = ?
      )
      """,
      Boolean.class,
      tableName
    ));
  }

  private String columnType(String tableName, String columnName) {
    return jdbcTemplate.queryForObject(
      """
      select data_type
      from information_schema.columns
      where table_schema = 'public'
        and table_name = ?
        and column_name = ?
      """,
      String.class,
      tableName,
      columnName
    );
  }

  private boolean constraintExists(String tableName, String constraintName, String constraintType) {
    return Boolean.TRUE.equals(jdbcTemplate.queryForObject(
      """
      select exists (
        select 1
        from information_schema.table_constraints
        where table_schema = 'public'
          and table_name = ?
          and constraint_name = ?
          and constraint_type = ?
      )
      """,
      Boolean.class,
      tableName,
      constraintName,
      constraintType
    ));
  }
}

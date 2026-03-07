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
    assertThat(flyway.info().current().getVersion().getVersion()).isEqualTo("18");

    assertThat(
      List.of(
        "tenants",
        "branches",
        "users",
        "receipt_sequences",
        "user_roles",
        "user_branch_access",
        "services",
        "clients",
        "appointments",
        "barber_services",
        "receipts",
        "receipt_items",
        "receipt_payments",
        "email_outbox",
        "notification_email_templates",
        "barber_weekly_availability",
        "barber_availability_exceptions",
        "barber_exception_intervals"
      )
    )
      .allMatch(this::tableExists);
    assertThat(columnType("tenants", "id")).isEqualTo("uuid");
    assertThat(columnType("branches", "id")).isEqualTo("uuid");
    assertThat(columnType("users", "id")).isEqualTo("uuid");
    assertThat(columnType("users", "full_name")).isEqualTo("character varying");
    assertThat(columnType("users", "active")).isEqualTo("boolean");
    assertThat(columnType("users", "phone")).isEqualTo("text");
    assertThat(columnType("receipt_sequences", "id")).isEqualTo("uuid");
    assertThat(columnType("branches", "active")).isEqualTo("boolean");
    assertThat(columnType("user_roles", "tenant_id")).isEqualTo("uuid");
    assertThat(columnType("user_roles", "user_id")).isEqualTo("uuid");
    assertThat(columnType("user_branch_access", "id")).isEqualTo("uuid");
    assertThat(columnType("user_branch_access", "tenant_id")).isEqualTo("uuid");
    assertThat(columnType("user_branch_access", "user_id")).isEqualTo("uuid");
    assertThat(columnType("user_branch_access", "branch_id")).isEqualTo("uuid");
    assertThat(columnType("services", "id")).isEqualTo("uuid");
    assertThat(columnType("services", "tenant_id")).isEqualTo("uuid");
    assertThat(columnType("services", "price")).isEqualTo("numeric");
    assertThat(columnType("clients", "id")).isEqualTo("uuid");
    assertThat(columnType("clients", "tenant_id")).isEqualTo("uuid");
    assertThat(columnType("clients", "branch_id")).isEqualTo("uuid");
    assertThat(columnType("appointments", "id")).isEqualTo("uuid");
    assertThat(columnType("appointments", "tenant_id")).isEqualTo("uuid");
    assertThat(columnType("appointments", "branch_id")).isEqualTo("uuid");
    assertThat(columnType("appointments", "client_id")).isEqualTo("uuid");
    assertThat(columnType("appointments", "barber_id")).isEqualTo("uuid");
    assertThat(columnType("appointments", "service_id")).isEqualTo("uuid");
    assertThat(columnType("appointments", "start_at")).isEqualTo("timestamp with time zone");
    assertThat(columnType("appointments", "end_at")).isEqualTo("timestamp with time zone");
    assertThat(columnType("barber_services", "id")).isEqualTo("uuid");
    assertThat(columnType("barber_services", "tenant_id")).isEqualTo("uuid");
    assertThat(columnType("barber_services", "barber_id")).isEqualTo("uuid");
    assertThat(columnType("barber_services", "service_id")).isEqualTo("uuid");
    assertThat(columnType("barber_services", "created_at")).isEqualTo("timestamp with time zone");
    assertThat(columnType("receipts", "id")).isEqualTo("uuid");
    assertThat(columnType("receipts", "tenant_id")).isEqualTo("uuid");
    assertThat(columnType("receipts", "branch_id")).isEqualTo("uuid");
    assertThat(columnType("receipts", "client_id")).isEqualTo("uuid");
    assertThat(columnType("receipts", "appointment_id")).isEqualTo("uuid");
    assertThat(columnType("receipts", "issued_at")).isEqualTo("timestamp with time zone");
    assertThat(columnType("receipts", "subtotal")).isEqualTo("numeric");
    assertThat(columnType("receipts", "discount")).isEqualTo("numeric");
    assertThat(columnType("receipts", "tax")).isEqualTo("numeric");
    assertThat(columnType("receipts", "total")).isEqualTo("numeric");
    assertThat(columnType("receipts", "voided_at")).isEqualTo("timestamp with time zone");
    assertThat(columnType("receipt_items", "id")).isEqualTo("uuid");
    assertThat(columnType("receipt_items", "tenant_id")).isEqualTo("uuid");
    assertThat(columnType("receipt_items", "receipt_id")).isEqualTo("uuid");
    assertThat(columnType("receipt_items", "service_id")).isEqualTo("uuid");
    assertThat(columnType("receipt_items", "unit_price")).isEqualTo("numeric");
    assertThat(columnType("receipt_items", "line_total")).isEqualTo("numeric");
    assertThat(columnType("receipt_items", "created_at")).isEqualTo("timestamp with time zone");
    assertThat(columnType("receipt_payments", "id")).isEqualTo("uuid");
    assertThat(columnType("receipt_payments", "tenant_id")).isEqualTo("uuid");
    assertThat(columnType("receipt_payments", "receipt_id")).isEqualTo("uuid");
    assertThat(columnType("receipt_payments", "amount")).isEqualTo("numeric");
    assertThat(columnType("receipt_payments", "created_at")).isEqualTo("timestamp with time zone");
    assertThat(columnType("email_outbox", "id")).isEqualTo("uuid");
    assertThat(columnType("email_outbox", "tenant_id")).isEqualTo("uuid");
    assertThat(columnType("email_outbox", "branch_id")).isEqualTo("uuid");
    assertThat(columnType("email_outbox", "kind")).isEqualTo("text");
    assertThat(columnType("email_outbox", "status")).isEqualTo("text");
    assertThat(columnType("email_outbox", "to_email")).isEqualTo("text");
    assertThat(columnType("email_outbox", "subject")).isEqualTo("text");
    assertThat(columnType("email_outbox", "body_text")).isEqualTo("text");
    assertThat(columnType("email_outbox", "body_html")).isEqualTo("text");
    assertThat(columnType("email_outbox", "dedup_key")).isEqualTo("text");
    assertThat(columnType("email_outbox", "appointment_id")).isEqualTo("uuid");
    assertThat(columnType("email_outbox", "attempts")).isEqualTo("integer");
    assertThat(columnType("email_outbox", "last_error")).isEqualTo("text");
    assertThat(columnType("email_outbox", "scheduled_at")).isEqualTo("timestamp with time zone");
    assertThat(columnType("email_outbox", "sent_at")).isEqualTo("timestamp with time zone");
    assertThat(columnType("email_outbox", "processing_started_at")).isEqualTo("timestamp with time zone");
    assertThat(columnType("email_outbox", "created_at")).isEqualTo("timestamp with time zone");
    assertThat(columnType("email_outbox", "updated_at")).isEqualTo("timestamp with time zone");
    assertThat(columnType("notification_email_templates", "id")).isEqualTo("uuid");
    assertThat(columnType("notification_email_templates", "tenant_id")).isEqualTo("uuid");
    assertThat(columnType("notification_email_templates", "kind")).isEqualTo("text");
    assertThat(columnType("notification_email_templates", "enabled")).isEqualTo("boolean");
    assertThat(columnType("notification_email_templates", "subject_template")).isEqualTo("text");
    assertThat(columnType("notification_email_templates", "body_text_template")).isEqualTo("text");
    assertThat(columnType("notification_email_templates", "body_html_template")).isEqualTo("text");
    assertThat(columnType("notification_email_templates", "created_at")).isEqualTo("timestamp with time zone");
    assertThat(columnType("notification_email_templates", "updated_at")).isEqualTo("timestamp with time zone");
    assertThat(columnType("barber_weekly_availability", "id")).isEqualTo("uuid");
    assertThat(columnType("barber_weekly_availability", "tenant_id")).isEqualTo("uuid");
    assertThat(columnType("barber_weekly_availability", "branch_id")).isEqualTo("uuid");
    assertThat(columnType("barber_weekly_availability", "barber_id")).isEqualTo("uuid");
    assertThat(columnType("barber_weekly_availability", "day_of_week")).isEqualTo("integer");
    assertThat(columnType("barber_weekly_availability", "start_time")).isEqualTo("time without time zone");
    assertThat(columnType("barber_weekly_availability", "end_time")).isEqualTo("time without time zone");
    assertThat(columnType("barber_availability_exceptions", "id")).isEqualTo("uuid");
    assertThat(columnType("barber_availability_exceptions", "tenant_id")).isEqualTo("uuid");
    assertThat(columnType("barber_availability_exceptions", "branch_id")).isEqualTo("uuid");
    assertThat(columnType("barber_availability_exceptions", "barber_id")).isEqualTo("uuid");
    assertThat(columnType("barber_availability_exceptions", "date")).isEqualTo("date");
    assertThat(columnType("barber_availability_exceptions", "type")).isEqualTo("text");
    assertThat(columnType("barber_exception_intervals", "id")).isEqualTo("uuid");
    assertThat(columnType("barber_exception_intervals", "tenant_id")).isEqualTo("uuid");
    assertThat(columnType("barber_exception_intervals", "exception_id")).isEqualTo("uuid");
    assertThat(columnType("barber_exception_intervals", "start_time")).isEqualTo("time without time zone");
    assertThat(columnType("barber_exception_intervals", "end_time")).isEqualTo("time without time zone");
    assertThat(columnNullable("users", "active")).isFalse();
    assertThat(columnNullable("users", "phone")).isTrue();
    assertThat(columnNullable("email_outbox", "branch_id")).isTrue();
    assertThat(columnNullable("email_outbox", "appointment_id")).isTrue();
    assertThat(columnNullable("email_outbox", "sent_at")).isTrue();
    assertThat(columnNullable("email_outbox", "processing_started_at")).isTrue();
    assertThat(columnNullable("notification_email_templates", "enabled")).isFalse();
    assertThat(columnNullable("notification_email_templates", "body_text_template")).isTrue();
    assertThat(columnNullable("notification_email_templates", "body_html_template")).isTrue();
    assertThat(columnDefault("users", "active")).contains("true");
    assertThat(columnDefault("notification_email_templates", "enabled")).contains("true");

    assertThat(constraintExists("branches", "uq_branches_tenant_code", "UNIQUE")).isTrue();
    assertThat(constraintExists("branches", "uq_branches_tenant_branch", "UNIQUE")).isTrue();
    assertThat(constraintExists("users", "uq_users_tenant_email", "UNIQUE")).isTrue();
    assertThat(constraintExists("users", "uq_users_tenant_user", "UNIQUE")).isTrue();
    assertThat(constraintExists("users", "ck_users_full_name_not_blank", "CHECK")).isTrue();
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
    assertThat(constraintExists(
      "user_branch_access",
      "uq_user_branch_access_tenant_user_branch",
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
    assertThat(constraintExists(
      "user_branch_access",
      "fk_user_branch_access_user",
      "FOREIGN KEY"
    )).isTrue();
    assertThat(constraintExists(
      "user_branch_access",
      "fk_user_branch_access_branch",
      "FOREIGN KEY"
    )).isTrue();
    assertThat(constraintExists("services", "fk_services_tenant", "FOREIGN KEY")).isTrue();
    assertThat(constraintExists(
      "services",
      "ck_services_duration_minutes_range",
      "CHECK"
    )).isTrue();
    assertThat(constraintExists("services", "ck_services_price_non_negative", "CHECK")).isTrue();
    assertThat(constraintExists("clients", "fk_clients_branch", "FOREIGN KEY")).isTrue();
    assertThat(constraintExists("clients", "ck_clients_full_name_min_length", "CHECK")).isTrue();
    assertThat(constraintExists("clients", "uq_clients_tenant_branch_id", "UNIQUE")).isTrue();
    assertThat(constraintExists("services", "uq_services_tenant_id_id", "UNIQUE")).isTrue();
    assertThat(constraintExists("appointments", "fk_appointments_branch", "FOREIGN KEY")).isTrue();
    assertThat(constraintExists("appointments", "fk_appointments_client", "FOREIGN KEY")).isTrue();
    assertThat(constraintExists("appointments", "fk_appointments_barber", "FOREIGN KEY")).isTrue();
    assertThat(constraintExists("appointments", "fk_appointments_service", "FOREIGN KEY")).isTrue();
    assertThat(constraintExists("appointments", "ck_appointments_status_valid", "CHECK")).isTrue();
    assertThat(constraintExists("appointments", "uq_appointments_tenant_branch_id", "UNIQUE"))
      .isTrue();
    assertThat(constraintExists("appointments", "ck_appointments_end_after_start", "CHECK"))
      .isTrue();
    assertThat(
      constraintExists("appointments", "ck_appointments_duration_seconds_range", "CHECK")
    ).isTrue();
    assertThat(exclusionConstraintExists("appointments", "ex_appt_no_overlap")).isTrue();
    assertThat(constraintExists(
      "barber_services",
      "uq_barber_services_tenant_barber_service",
      "UNIQUE"
    )).isTrue();
    assertThat(constraintExists(
      "barber_services",
      "fk_barber_services_barber",
      "FOREIGN KEY"
    )).isTrue();
    assertThat(constraintExists(
      "barber_services",
      "fk_barber_services_service",
      "FOREIGN KEY"
    )).isTrue();
    assertThat(constraintExists("receipts", "uq_receipts_tenant_id", "UNIQUE")).isTrue();
    assertThat(constraintExists(
      "receipts",
      "uq_receipts_tenant_branch_number",
      "UNIQUE"
    )).isTrue();
    assertThat(constraintExists("receipts", "fk_receipts_branch", "FOREIGN KEY")).isTrue();
    assertThat(constraintExists("receipts", "fk_receipts_client", "FOREIGN KEY")).isTrue();
    assertThat(constraintExists("receipts", "fk_receipts_appointment", "FOREIGN KEY")).isTrue();
    assertThat(constraintExists("receipts", "ck_receipts_status_valid", "CHECK")).isTrue();
    assertThat(constraintExists("receipts", "ck_receipts_total_formula", "CHECK")).isTrue();
    assertThat(constraintExists("receipts", "ck_receipts_void_state", "CHECK")).isTrue();
    assertThat(constraintExists(
      "receipt_items",
      "fk_receipt_items_receipt",
      "FOREIGN KEY"
    )).isTrue();
    assertThat(constraintExists(
      "receipt_items",
      "fk_receipt_items_service",
      "FOREIGN KEY"
    )).isTrue();
    assertThat(constraintExists(
      "receipt_items",
      "ck_receipt_items_line_total_formula",
      "CHECK"
    )).isTrue();
    assertThat(constraintExists(
      "receipt_payments",
      "fk_receipt_payments_receipt",
      "FOREIGN KEY"
    )).isTrue();
    assertThat(constraintExists(
      "receipt_payments",
      "ck_receipt_payments_method_valid",
      "CHECK"
    )).isTrue();
    assertThat(constraintExists(
      "email_outbox",
      "uq_email_outbox_tenant_dedup_key",
      "UNIQUE"
    )).isTrue();
    assertThat(constraintExists("email_outbox", "fk_email_outbox_branch", "FOREIGN KEY")).isTrue();
    assertThat(constraintExists(
      "email_outbox",
      "fk_email_outbox_appointment",
      "FOREIGN KEY"
    )).isTrue();
    assertThat(constraintExists("email_outbox", "ck_email_outbox_kind_valid", "CHECK")).isTrue();
    assertThat(constraintExists("email_outbox", "ck_email_outbox_status_valid", "CHECK")).isTrue();
    assertThat(constraintExists(
      "email_outbox",
      "ck_email_outbox_attempts_non_negative",
      "CHECK"
    )).isTrue();
    assertThat(constraintExists("email_outbox", "ck_email_outbox_body_present", "CHECK")).isTrue();
    assertThat(constraintExists(
      "email_outbox",
      "ck_email_outbox_appointment_requires_branch",
      "CHECK"
    )).isTrue();
    assertThat(constraintExists(
      "notification_email_templates",
      "uq_notification_email_templates_tenant_kind",
      "UNIQUE"
    )).isTrue();
    assertThat(constraintExists(
      "notification_email_templates",
      "fk_notification_email_templates_tenant",
      "FOREIGN KEY"
    )).isTrue();
    assertThat(constraintExists(
      "notification_email_templates",
      "ck_notification_email_templates_kind_valid",
      "CHECK"
    )).isTrue();
    assertThat(constraintExists(
      "notification_email_templates",
      "ck_notification_email_templates_body_present",
      "CHECK"
    )).isTrue();
    assertThat(constraintExists(
      "barber_weekly_availability",
      "fk_barber_weekly_availability_branch",
      "FOREIGN KEY"
    )).isTrue();
    assertThat(constraintExists(
      "barber_weekly_availability",
      "fk_barber_weekly_availability_barber",
      "FOREIGN KEY"
    )).isTrue();
    assertThat(constraintExists(
      "barber_weekly_availability",
      "ck_barber_weekly_availability_day_of_week",
      "CHECK"
    )).isTrue();
    assertThat(constraintExists(
      "barber_weekly_availability",
      "ck_barber_weekly_availability_time_range",
      "CHECK"
    )).isTrue();
    assertThat(constraintExists(
      "barber_availability_exceptions",
      "uq_barber_availability_exceptions_tenant_id",
      "UNIQUE"
    )).isTrue();
    assertThat(constraintExists(
      "barber_availability_exceptions",
      "uq_barber_availability_exceptions_tenant_branch_barber_date",
      "UNIQUE"
    )).isTrue();
    assertThat(constraintExists(
      "barber_availability_exceptions",
      "fk_barber_availability_exceptions_branch",
      "FOREIGN KEY"
    )).isTrue();
    assertThat(constraintExists(
      "barber_availability_exceptions",
      "fk_barber_availability_exceptions_barber",
      "FOREIGN KEY"
    )).isTrue();
    assertThat(constraintExists(
      "barber_availability_exceptions",
      "ck_barber_availability_exceptions_type",
      "CHECK"
    )).isTrue();
    assertThat(constraintExists(
      "barber_exception_intervals",
      "fk_barber_exception_intervals_exception",
      "FOREIGN KEY"
    )).isTrue();
    assertThat(constraintExists(
      "barber_exception_intervals",
      "ck_barber_exception_intervals_time_range",
      "CHECK"
    )).isTrue();

    assertThat(constraintDefinition(
      "user_branch_access",
      "uq_user_branch_access_tenant_user_branch"
    )).contains("UNIQUE (tenant_id, user_id, branch_id)");
    assertThat(constraintDefinition("user_branch_access", "fk_user_branch_access_user"))
      .contains("FOREIGN KEY (tenant_id, user_id)")
      .contains("REFERENCES users(tenant_id, id)")
      .contains("ON DELETE CASCADE");
    assertThat(constraintDefinition("user_branch_access", "fk_user_branch_access_branch"))
      .contains("FOREIGN KEY (tenant_id, branch_id)")
      .contains("REFERENCES branches(tenant_id, id)")
      .contains("ON DELETE CASCADE");
    assertThat(constraintDefinition("services", "ck_services_duration_minutes_range"))
      .contains("duration_minutes >= 5")
      .contains("duration_minutes <= 480");
    assertThat(constraintDefinition("services", "ck_services_price_non_negative"))
      .contains("price >=")
      .contains("0");
    assertThat(constraintDefinition("clients", "fk_clients_branch"))
      .contains("FOREIGN KEY (tenant_id, branch_id)")
      .contains("REFERENCES branches(tenant_id, id)")
      .contains("ON DELETE RESTRICT");
    assertThat(constraintDefinition("clients", "uq_clients_tenant_branch_id"))
      .contains("UNIQUE (tenant_id, branch_id, id)");
    assertThat(constraintDefinition("services", "uq_services_tenant_id_id"))
      .contains("UNIQUE (tenant_id, id)");
    assertThat(constraintDefinition("appointments", "fk_appointments_branch"))
      .contains("FOREIGN KEY (tenant_id, branch_id)")
      .contains("REFERENCES branches(tenant_id, id)");
    assertThat(constraintDefinition("appointments", "fk_appointments_client"))
      .contains("FOREIGN KEY (tenant_id, branch_id, client_id)")
      .contains("REFERENCES clients(tenant_id, branch_id, id)");
    assertThat(constraintDefinition("appointments", "fk_appointments_barber"))
      .contains("FOREIGN KEY (tenant_id, barber_id)")
      .contains("REFERENCES users(tenant_id, id)");
    assertThat(constraintDefinition("appointments", "uq_appointments_tenant_branch_id"))
      .contains("UNIQUE (tenant_id, branch_id, id)");
    assertThat(constraintDefinition("appointments", "fk_appointments_service"))
      .contains("FOREIGN KEY (tenant_id, service_id)")
      .contains("REFERENCES services(tenant_id, id)");
    assertThat(constraintDefinition("appointments", "ck_appointments_status_valid"))
      .contains("status")
      .contains("scheduled")
      .contains("checked_in")
      .contains("completed")
      .contains("cancelled")
      .contains("no_show");
    assertThat(constraintDefinition("appointments", "ck_appointments_end_after_start"))
      .contains("end_at > start_at");
    assertThat(constraintDefinition("appointments", "ck_appointments_duration_seconds_range"))
      .contains("EXTRACT(epoch FROM (end_at - start_at))")
      .contains("300")
      .contains("28800");
    assertThat(constraintDefinition("appointments", "ex_appt_no_overlap"))
      .contains("EXCLUDE USING gist")
      .contains("tstzrange(start_at, end_at")
      .contains("status")
      .contains("scheduled")
      .contains("checked_in");
    assertThat(constraintDefinition(
      "barber_services",
      "uq_barber_services_tenant_barber_service"
    )).contains("UNIQUE (tenant_id, barber_id, service_id)");
    assertThat(constraintDefinition("barber_services", "fk_barber_services_barber"))
      .contains("FOREIGN KEY (tenant_id, barber_id)")
      .contains("REFERENCES users(tenant_id, id)")
      .contains("ON DELETE CASCADE");
    assertThat(constraintDefinition("barber_services", "fk_barber_services_service"))
      .contains("FOREIGN KEY (tenant_id, service_id)")
      .contains("REFERENCES services(tenant_id, id)")
      .contains("ON DELETE RESTRICT");
    assertThat(constraintDefinition("receipts", "uq_receipts_tenant_id"))
      .contains("UNIQUE (tenant_id, id)");
    assertThat(constraintDefinition("receipts", "uq_receipts_tenant_branch_number"))
      .contains("UNIQUE (tenant_id, branch_id, number)");
    assertThat(constraintDefinition("receipts", "fk_receipts_branch"))
      .contains("FOREIGN KEY (tenant_id, branch_id)")
      .contains("REFERENCES branches(tenant_id, id)");
    assertThat(constraintDefinition("receipts", "fk_receipts_client"))
      .contains("FOREIGN KEY (tenant_id, branch_id, client_id)")
      .contains("REFERENCES clients(tenant_id, branch_id, id)");
    assertThat(constraintDefinition("receipts", "fk_receipts_appointment"))
      .contains("FOREIGN KEY (tenant_id, branch_id, appointment_id)")
      .contains("REFERENCES appointments(tenant_id, branch_id, id)");
    assertThat(constraintDefinition("receipts", "ck_receipts_status_valid"))
      .contains("status")
      .contains("issued")
      .contains("voided");
    assertThat(constraintDefinition("receipts", "ck_receipts_total_formula"))
      .contains("total = ((subtotal - discount) + tax)");
    assertThat(constraintDefinition("receipts", "ck_receipts_void_state"))
      .contains("status = 'issued'")
      .contains("status = 'voided'")
      .contains("void_reason")
      .contains("voided_at");
    assertThat(constraintDefinition("receipt_items", "fk_receipt_items_receipt"))
      .contains("FOREIGN KEY (tenant_id, receipt_id)")
      .contains("REFERENCES receipts(tenant_id, id)")
      .contains("ON DELETE CASCADE");
    assertThat(constraintDefinition("receipt_items", "fk_receipt_items_service"))
      .contains("FOREIGN KEY (tenant_id, service_id)")
      .contains("REFERENCES services(tenant_id, id)")
      .contains("ON DELETE RESTRICT");
    assertThat(constraintDefinition("receipt_items", "ck_receipt_items_line_total_formula"))
      .contains("line_total = ((quantity)::numeric * unit_price)");
    assertThat(constraintDefinition("receipt_payments", "fk_receipt_payments_receipt"))
      .contains("FOREIGN KEY (tenant_id, receipt_id)")
      .contains("REFERENCES receipts(tenant_id, id)")
      .contains("ON DELETE CASCADE");
    assertThat(constraintDefinition("receipt_payments", "ck_receipt_payments_method_valid"))
      .contains("method")
      .contains("cash")
      .contains("card")
      .contains("transfer")
      .contains("other");
    assertThat(constraintDefinition("email_outbox", "uq_email_outbox_tenant_dedup_key"))
      .contains("UNIQUE (tenant_id, dedup_key)");
    assertThat(constraintDefinition("email_outbox", "fk_email_outbox_branch"))
      .contains("FOREIGN KEY (tenant_id, branch_id)")
      .contains("REFERENCES branches(tenant_id, id)");
    assertThat(constraintDefinition("email_outbox", "fk_email_outbox_appointment"))
      .contains("FOREIGN KEY (tenant_id, branch_id, appointment_id)")
      .contains("REFERENCES appointments(tenant_id, branch_id, id)");
    assertThat(constraintDefinition("email_outbox", "ck_email_outbox_kind_valid"))
      .contains("appointment_confirmation")
      .contains("appointment_reminder")
      .contains("appointment_rescheduled")
      .contains("appointment_cancelled");
    assertThat(constraintDefinition("email_outbox", "ck_email_outbox_status_valid"))
      .contains("pending")
      .contains("processing")
      .contains("sent")
      .contains("failed")
      .contains("cancelled");
    assertThat(constraintDefinition("email_outbox", "ck_email_outbox_attempts_non_negative"))
      .contains("attempts >= 0");
    assertThat(constraintDefinition("email_outbox", "ck_email_outbox_body_present"))
      .contains("body_text IS NOT NULL")
      .contains("body_html IS NOT NULL");
    assertThat(
      constraintDefinition("email_outbox", "ck_email_outbox_appointment_requires_branch")
    )
      .contains("appointment_id IS NULL")
      .contains("branch_id IS NOT NULL");
    assertThat(constraintDefinition(
      "notification_email_templates",
      "uq_notification_email_templates_tenant_kind"
    )).contains("UNIQUE (tenant_id, kind)");
    assertThat(constraintDefinition(
      "notification_email_templates",
      "fk_notification_email_templates_tenant"
    ))
      .contains("FOREIGN KEY (tenant_id)")
      .contains("REFERENCES tenants(id)")
      .contains("ON DELETE CASCADE");
    assertThat(constraintDefinition(
      "notification_email_templates",
      "ck_notification_email_templates_kind_valid"
    ))
      .contains("appointment_confirmation")
      .contains("appointment_reminder")
      .contains("appointment_rescheduled")
      .contains("appointment_cancelled");
    assertThat(constraintDefinition(
      "notification_email_templates",
      "ck_notification_email_templates_body_present"
    ))
      .contains("body_text_template IS NOT NULL")
      .contains("body_html_template IS NOT NULL");
    assertThat(constraintDefinition(
      "barber_weekly_availability",
      "fk_barber_weekly_availability_branch"
    ))
      .contains("FOREIGN KEY (tenant_id, branch_id)")
      .contains("REFERENCES branches(tenant_id, id)")
      .contains("ON DELETE CASCADE");
    assertThat(constraintDefinition(
      "barber_weekly_availability",
      "fk_barber_weekly_availability_barber"
    ))
      .contains("FOREIGN KEY (tenant_id, barber_id)")
      .contains("REFERENCES users(tenant_id, id)")
      .contains("ON DELETE CASCADE");
    assertThat(constraintDefinition(
      "barber_weekly_availability",
      "ck_barber_weekly_availability_day_of_week"
    ))
      .contains("day_of_week >= 1")
      .contains("day_of_week <= 7");
    assertThat(constraintDefinition(
      "barber_weekly_availability",
      "ck_barber_weekly_availability_time_range"
    ))
      .contains("end_time > start_time");
    assertThat(constraintDefinition(
      "barber_availability_exceptions",
      "uq_barber_availability_exceptions_tenant_id"
    )).contains("UNIQUE (tenant_id, id)");
    assertThat(constraintDefinition(
      "barber_availability_exceptions",
      "uq_barber_availability_exceptions_tenant_branch_barber_date"
    )).contains("UNIQUE (tenant_id, branch_id, barber_id, date)");
    assertThat(constraintDefinition(
      "barber_availability_exceptions",
      "fk_barber_availability_exceptions_branch"
    ))
      .contains("FOREIGN KEY (tenant_id, branch_id)")
      .contains("REFERENCES branches(tenant_id, id)")
      .contains("ON DELETE CASCADE");
    assertThat(constraintDefinition(
      "barber_availability_exceptions",
      "fk_barber_availability_exceptions_barber"
    ))
      .contains("FOREIGN KEY (tenant_id, barber_id)")
      .contains("REFERENCES users(tenant_id, id)")
      .contains("ON DELETE CASCADE");
    assertThat(constraintDefinition(
      "barber_availability_exceptions",
      "ck_barber_availability_exceptions_type"
    ))
      .contains("closed")
      .contains("override");
    assertThat(constraintDefinition(
      "barber_exception_intervals",
      "fk_barber_exception_intervals_exception"
    ))
      .contains("FOREIGN KEY (tenant_id, exception_id)")
      .contains("REFERENCES barber_availability_exceptions(tenant_id, id)")
      .contains("ON DELETE CASCADE");
    assertThat(constraintDefinition(
      "barber_exception_intervals",
      "ck_barber_exception_intervals_time_range"
    ))
      .contains("end_time > start_time");

    assertThat(indexDefinition("ix_user_branch_access_tenant_user"))
      .contains("ON public.user_branch_access")
      .contains("(tenant_id, user_id)");
    assertThat(indexDefinition("ix_user_branch_access_tenant_branch"))
      .contains("ON public.user_branch_access")
      .contains("(tenant_id, branch_id)");
    assertThat(indexDefinition("ux_users_email_global_lower"))
      .contains("CREATE UNIQUE INDEX")
      .contains("ON public.users")
      .contains("lower");
    assertThat(indexDefinition("ux_services_tenant_name_ci"))
      .contains("CREATE UNIQUE INDEX")
      .contains("ON public.services")
      .contains("(tenant_id, lower(name))");
    assertThat(indexDefinition("idx_services_tenant_active"))
      .contains("ON public.services")
      .contains("(tenant_id, active)");
    assertThat(indexDefinition("idx_clients_tenant_branch_created_at"))
      .contains("ON public.clients")
      .contains("(tenant_id, branch_id, created_at DESC)");
    assertThat(indexDefinition("idx_clients_tenant_branch_name_ci"))
      .contains("ON public.clients")
      .contains("(tenant_id, branch_id, lower(full_name))");
    assertThat(indexDefinition("idx_clients_tenant_branch_phone"))
      .contains("ON public.clients")
      .contains("(tenant_id, branch_id, phone)")
      .contains("WHERE (phone IS NOT NULL)");
    assertThat(indexDefinition("idx_clients_tenant_branch_email_ci"))
      .contains("ON public.clients")
      .contains("(tenant_id, branch_id, lower(email))")
      .contains("WHERE (email IS NOT NULL)");
    assertThat(indexDefinition("idx_user_roles_tenant_role"))
      .contains("ON public.user_roles")
      .contains("(tenant_id, role)");
    assertThat(indexDefinition("idx_users_tenant_active"))
      .contains("ON public.users")
      .contains("(tenant_id, active)");
    assertThat(indexDefinition("idx_uba_tenant_branch_user"))
      .contains("ON public.user_branch_access")
      .contains("(tenant_id, branch_id, user_id)");
    assertThat(indexDefinition("idx_appt_tenant_branch_start"))
      .contains("ON public.appointments")
      .contains("(tenant_id, branch_id, start_at)");
    assertThat(indexDefinition("idx_appt_tenant_branch_barber_start"))
      .contains("ON public.appointments")
      .contains("(tenant_id, branch_id, barber_id, start_at)");
    assertThat(indexDefinition("idx_appt_tenant_branch_status_start"))
      .contains("ON public.appointments")
      .contains("(tenant_id, branch_id, status, start_at)");
    assertThat(indexDefinition("idx_appointments_client"))
      .contains("ON public.appointments")
      .contains("(tenant_id, branch_id, client_id, start_at DESC)");
    assertThat(indexDefinition("idx_barber_services_tenant_barber"))
      .contains("ON public.barber_services")
      .contains("(tenant_id, barber_id)");
    assertThat(indexDefinition("idx_barber_services_tenant_service"))
      .contains("ON public.barber_services")
      .contains("(tenant_id, service_id)");
    assertThat(indexDefinition("idx_receipts_tenant_branch_issued_at"))
      .contains("ON public.receipts")
      .contains("(tenant_id, branch_id, issued_at DESC)");
    assertThat(indexDefinition("idx_receipts_tenant_branch_status_issued_at"))
      .contains("ON public.receipts")
      .contains("(tenant_id, branch_id, status, issued_at DESC)");
    assertThat(indexDefinition("idx_receipts_number"))
      .contains("ON public.receipts")
      .contains("(tenant_id, branch_id, number)");
    assertThat(indexDefinition("idx_receipts_client"))
      .contains("ON public.receipts")
      .contains("(tenant_id, branch_id, client_id, issued_at DESC)");
    assertThat(indexDefinition("ux_receipts_tenant_branch_appointment_issued"))
      .contains("CREATE UNIQUE INDEX")
      .contains("ON public.receipts")
      .contains("(tenant_id, branch_id, appointment_id)")
      .contains("WHERE ((appointment_id IS NOT NULL) AND (status = 'issued'::text))");
    assertThat(indexDefinition("idx_receipt_items_receipt"))
      .contains("ON public.receipt_items")
      .contains("(tenant_id, receipt_id)");
    assertThat(indexDefinition("idx_receipt_items_tenant_service"))
      .contains("ON public.receipt_items")
      .contains("(tenant_id, service_id)")
      .contains("WHERE (service_id IS NOT NULL)");
    assertThat(indexDefinition("idx_receipt_payments_receipt"))
      .contains("ON public.receipt_payments")
      .contains("(tenant_id, receipt_id)");
    assertThat(indexDefinition("idx_email_outbox_pending_due"))
      .contains("ON public.email_outbox")
      .contains("(scheduled_at)")
      .contains("WHERE (status = 'pending'::text)");
    assertThat(indexDefinition("idx_email_outbox_tenant_created_at"))
      .contains("ON public.email_outbox")
      .contains("(tenant_id, created_at DESC)");
    assertThat(indexDefinition("idx_email_outbox_appt_kind"))
      .contains("ON public.email_outbox")
      .contains("(tenant_id, branch_id, appointment_id, kind)")
      .contains("WHERE (appointment_id IS NOT NULL)");
    assertThat(indexDefinition("idx_notification_email_templates_tenant_kind"))
      .contains("ON public.notification_email_templates")
      .contains("(tenant_id, kind)");
    assertThat(indexDefinition("idx_weekly_lookup"))
      .contains("ON public.barber_weekly_availability")
      .contains("(tenant_id, branch_id, barber_id, day_of_week)");
    assertThat(indexDefinition("idx_exceptions_lookup"))
      .contains("ON public.barber_availability_exceptions")
      .contains("(tenant_id, branch_id, barber_id, date)");
    assertThat(indexDefinition("idx_barber_exception_intervals_exception"))
      .contains("ON public.barber_exception_intervals")
      .contains("(tenant_id, exception_id)");
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

  private boolean columnNullable(String tableName, String columnName) {
    return "YES".equals(jdbcTemplate.queryForObject(
      """
      select is_nullable
      from information_schema.columns
      where table_schema = 'public'
        and table_name = ?
        and column_name = ?
      """,
      String.class,
      tableName,
      columnName
    ));
  }

  private String columnDefault(String tableName, String columnName) {
    return jdbcTemplate.queryForObject(
      """
      select column_default
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

  private String constraintDefinition(String tableName, String constraintName) {
    return jdbcTemplate.queryForObject(
      """
      select pg_get_constraintdef(c.oid)
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where n.nspname = 'public'
        and t.relname = ?
        and c.conname = ?
      """,
      String.class,
      tableName,
      constraintName
    );
  }

  private boolean exclusionConstraintExists(String tableName, String constraintName) {
    return Boolean.TRUE.equals(jdbcTemplate.queryForObject(
      """
      select exists (
        select 1
        from pg_constraint c
        join pg_class t on t.oid = c.conrelid
        join pg_namespace n on n.oid = t.relnamespace
        where n.nspname = 'public'
          and t.relname = ?
          and c.conname = ?
          and c.contype = 'x'
      )
      """,
      Boolean.class,
      tableName,
      constraintName
    ));
  }

  private String indexDefinition(String indexName) {
    return jdbcTemplate.queryForObject(
      """
      select indexdef
      from pg_indexes
      where schemaname = 'public'
        and indexname = ?
      """,
      String.class,
      indexName
    );
  }
}

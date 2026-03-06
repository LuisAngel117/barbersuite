package com.barbersuite.backend.cash;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcReceiptsRepository {

  private static final RowMapper<ReceiptRow> RECEIPT_ROW_MAPPER = JdbcReceiptsRepository::mapReceiptRow;
  private static final RowMapper<ReceiptItemRow> RECEIPT_ITEM_ROW_MAPPER =
    JdbcReceiptsRepository::mapReceiptItemRow;
  private static final RowMapper<ReceiptPaymentRow> RECEIPT_PAYMENT_ROW_MAPPER =
    JdbcReceiptsRepository::mapReceiptPaymentRow;

  private final JdbcTemplate jdbcTemplate;

  public JdbcReceiptsRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public void insertReceipt(
    UUID tenantId,
    UUID branchId,
    UUID receiptId,
    String number,
    ReceiptStatus status,
    UUID clientId,
    UUID appointmentId,
    Instant issuedAt,
    BigDecimal subtotal,
    BigDecimal discount,
    BigDecimal tax,
    BigDecimal total,
    String notes
  ) {
    jdbcTemplate.update(
      """
      insert into receipts (
        id,
        tenant_id,
        branch_id,
        number,
        status,
        client_id,
        appointment_id,
        issued_at,
        subtotal,
        discount,
        tax,
        total,
        notes,
        created_at,
        updated_at
      )
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), now())
      """,
      receiptId,
      tenantId,
      branchId,
      number,
      status.name(),
      clientId,
      appointmentId,
      Timestamp.from(issuedAt),
      subtotal,
      discount,
      tax,
      total,
      notes
    );
  }

  public void insertItems(UUID tenantId, UUID receiptId, List<ReceiptItemInsertRow> items) {
    for (ReceiptItemInsertRow item : items) {
      jdbcTemplate.update(
        """
        insert into receipt_items (
          id,
          tenant_id,
          receipt_id,
          service_id,
          description,
          quantity,
          unit_price,
          line_total,
          created_at
        )
        values (?, ?, ?, ?, ?, ?, ?, ?, now())
        """,
        item.id(),
        tenantId,
        receiptId,
        item.serviceId(),
        item.description(),
        item.quantity(),
        item.unitPrice(),
        item.lineTotal()
      );
    }
  }

  public void insertPayments(UUID tenantId, UUID receiptId, List<ReceiptPaymentInsertRow> payments) {
    for (ReceiptPaymentInsertRow payment : payments) {
      jdbcTemplate.update(
        """
        insert into receipt_payments (
          id,
          tenant_id,
          receipt_id,
          method,
          amount,
          reference,
          created_at
        )
        values (?, ?, ?, ?, ?, ?, now())
        """,
        payment.id(),
        tenantId,
        receiptId,
        payment.method().name(),
        payment.amount(),
        payment.reference()
      );
    }
  }

  public Optional<ReceiptRow> findReceiptById(UUID tenantId, UUID branchId, UUID receiptId) {
    return jdbcTemplate.query(
      """
      select id,
             number,
             status,
             client_id,
             appointment_id,
             issued_at,
             subtotal,
             discount,
             tax,
             total,
             notes,
             void_reason,
             voided_at,
             created_at,
             updated_at
      from receipts
      where tenant_id = ?
        and branch_id = ?
        and id = ?
      """,
      RECEIPT_ROW_MAPPER,
      tenantId,
      branchId,
      receiptId
    ).stream().findFirst();
  }

  public List<ReceiptRow> listReceipts(
    UUID tenantId,
    UUID branchId,
    ReceiptFilter filter,
    int page,
    int size
  ) {
    QueryParts queryParts = queryParts(
      """
      select r.id,
             r.number,
             r.status,
             r.client_id,
             r.appointment_id,
             r.issued_at,
             r.subtotal,
             r.discount,
             r.tax,
             r.total,
             r.notes,
             r.void_reason,
             r.voided_at,
             r.created_at,
             r.updated_at
      from receipts r
      left join clients c
        on c.tenant_id = r.tenant_id
       and c.branch_id = r.branch_id
       and c.id = r.client_id
      where r.tenant_id = ?
        and r.branch_id = ?
      """,
      tenantId,
      branchId,
      filter
    );

    queryParts.sqlBuilder().append(
      """
      order by r.issued_at desc, r.created_at desc
      limit ?
      offset ?
      """
    );
    queryParts.arguments().add(size);
    queryParts.arguments().add((long) page * size);

    return jdbcTemplate.query(
      queryParts.sqlBuilder().toString(),
      RECEIPT_ROW_MAPPER,
      queryParts.arguments().toArray()
    );
  }

  public long countReceipts(UUID tenantId, UUID branchId, ReceiptFilter filter) {
    QueryParts queryParts = queryParts(
      """
      select count(*)
      from receipts r
      left join clients c
        on c.tenant_id = r.tenant_id
       and c.branch_id = r.branch_id
       and c.id = r.client_id
      where r.tenant_id = ?
        and r.branch_id = ?
      """,
      tenantId,
      branchId,
      filter
    );

    Long count = jdbcTemplate.queryForObject(
      queryParts.sqlBuilder().toString(),
      Long.class,
      queryParts.arguments().toArray()
    );
    return count == null ? 0L : count;
  }

  public List<ReceiptItemRow> listItemsByReceiptIds(UUID tenantId, List<UUID> receiptIds) {
    if (receiptIds.isEmpty()) {
      return List.of();
    }

    String placeholders = String.join(", ", Collections.nCopies(receiptIds.size(), "?"));
    List<Object> arguments = new ArrayList<>();
    arguments.add(tenantId);
    arguments.addAll(receiptIds);

    return jdbcTemplate.query(
      """
      select id, receipt_id, service_id, description, quantity, unit_price, line_total
      from receipt_items
      where tenant_id = ?
        and receipt_id in (%s)
      order by created_at asc, id asc
      """.formatted(placeholders),
      RECEIPT_ITEM_ROW_MAPPER,
      arguments.toArray()
    );
  }

  public List<ReceiptPaymentRow> listPaymentsByReceiptIds(UUID tenantId, List<UUID> receiptIds) {
    if (receiptIds.isEmpty()) {
      return List.of();
    }

    String placeholders = String.join(", ", Collections.nCopies(receiptIds.size(), "?"));
    List<Object> arguments = new ArrayList<>();
    arguments.add(tenantId);
    arguments.addAll(receiptIds);

    return jdbcTemplate.query(
      """
      select id, receipt_id, method, amount, reference
      from receipt_payments
      where tenant_id = ?
        and receipt_id in (%s)
      order by created_at asc, id asc
      """.formatted(placeholders),
      RECEIPT_PAYMENT_ROW_MAPPER,
      arguments.toArray()
    );
  }

  public int voidReceipt(
    UUID tenantId,
    UUID branchId,
    UUID receiptId,
    String reason,
    Instant voidedAt
  ) {
    return jdbcTemplate.update(
      """
      update receipts
      set status = 'voided',
          void_reason = ?,
          voided_at = ?,
          updated_at = now()
      where tenant_id = ?
        and branch_id = ?
        and id = ?
      """,
      reason,
      Timestamp.from(voidedAt),
      tenantId,
      branchId,
      receiptId
    );
  }

  private QueryParts queryParts(
    String baseSql,
    UUID tenantId,
    UUID branchId,
    ReceiptFilter filter
  ) {
    StringBuilder sqlBuilder = new StringBuilder(baseSql);
    List<Object> arguments = new ArrayList<>();
    arguments.add(tenantId);
    arguments.add(branchId);

    if (filter.fromInclusive() != null) {
      sqlBuilder.append(" and r.issued_at >= ?");
      arguments.add(Timestamp.from(filter.fromInclusive()));
    }

    if (filter.toExclusive() != null) {
      sqlBuilder.append(" and r.issued_at < ?");
      arguments.add(Timestamp.from(filter.toExclusive()));
    }

    if (filter.status() != null) {
      sqlBuilder.append(" and r.status = ?");
      arguments.add(filter.status().name());
    }

    if (filter.query() != null) {
      String textLike = "%" + filter.query().toLowerCase(Locale.ROOT) + "%";
      String phoneLike = "%" + filter.query() + "%";
      sqlBuilder.append(
        """
          and (
            lower(r.number) like ?
            or lower(coalesce(c.full_name, '')) like ?
            or coalesce(c.phone, '') like ?
            or lower(coalesce(c.email, '')) like ?
          )
        """
      );
      arguments.add(textLike);
      arguments.add(textLike);
      arguments.add(phoneLike);
      arguments.add(textLike);
    }

    return new QueryParts(sqlBuilder, arguments);
  }

  private static ReceiptRow mapReceiptRow(ResultSet resultSet, int rowNum) throws SQLException {
    return new ReceiptRow(
      resultSet.getObject("id", UUID.class),
      resultSet.getString("number"),
      ReceiptStatus.parse(resultSet.getString("status")),
      resultSet.getObject("client_id", UUID.class),
      resultSet.getObject("appointment_id", UUID.class),
      resultSet.getTimestamp("issued_at").toInstant(),
      resultSet.getBigDecimal("subtotal"),
      resultSet.getBigDecimal("discount"),
      resultSet.getBigDecimal("tax"),
      resultSet.getBigDecimal("total"),
      resultSet.getString("notes"),
      resultSet.getString("void_reason"),
      toInstantOrNull(resultSet.getTimestamp("voided_at")),
      resultSet.getTimestamp("created_at").toInstant(),
      resultSet.getTimestamp("updated_at").toInstant()
    );
  }

  private static ReceiptItemRow mapReceiptItemRow(ResultSet resultSet, int rowNum) throws SQLException {
    return new ReceiptItemRow(
      resultSet.getObject("id", UUID.class),
      resultSet.getObject("receipt_id", UUID.class),
      resultSet.getObject("service_id", UUID.class),
      resultSet.getString("description"),
      resultSet.getInt("quantity"),
      resultSet.getBigDecimal("unit_price"),
      resultSet.getBigDecimal("line_total")
    );
  }

  private static ReceiptPaymentRow mapReceiptPaymentRow(ResultSet resultSet, int rowNum)
    throws SQLException {
    return new ReceiptPaymentRow(
      resultSet.getObject("id", UUID.class),
      resultSet.getObject("receipt_id", UUID.class),
      PaymentMethod.parse(resultSet.getString("method")),
      resultSet.getBigDecimal("amount"),
      resultSet.getString("reference")
    );
  }

  private static Instant toInstantOrNull(Timestamp timestamp) {
    return timestamp == null ? null : timestamp.toInstant();
  }

  public record ReceiptRow(
    UUID id,
    String number,
    ReceiptStatus status,
    UUID clientId,
    UUID appointmentId,
    Instant issuedAt,
    BigDecimal subtotal,
    BigDecimal discount,
    BigDecimal tax,
    BigDecimal total,
    String notes,
    String voidReason,
    Instant voidedAt,
    Instant createdAt,
    Instant updatedAt
  ) {
  }

  public record ReceiptItemInsertRow(
    UUID id,
    UUID serviceId,
    String description,
    int quantity,
    BigDecimal unitPrice,
    BigDecimal lineTotal
  ) {
  }

  public record ReceiptPaymentInsertRow(
    UUID id,
    PaymentMethod method,
    BigDecimal amount,
    String reference
  ) {
  }

  public record ReceiptItemRow(
    UUID id,
    UUID receiptId,
    UUID serviceId,
    String description,
    int quantity,
    BigDecimal unitPrice,
    BigDecimal lineTotal
  ) {
  }

  public record ReceiptPaymentRow(
    UUID id,
    UUID receiptId,
    PaymentMethod method,
    BigDecimal amount,
    String reference
  ) {
  }

  public record ReceiptFilter(
    Instant fromInclusive,
    Instant toExclusive,
    ReceiptStatus status,
    String query
  ) {
  }

  private record QueryParts(StringBuilder sqlBuilder, List<Object> arguments) {
  }
}

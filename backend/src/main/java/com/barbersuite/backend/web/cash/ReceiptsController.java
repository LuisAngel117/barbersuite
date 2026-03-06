package com.barbersuite.backend.web.cash;

import com.barbersuite.backend.cash.CashService;
import com.barbersuite.backend.web.branch.BranchRequired;
import com.barbersuite.backend.web.cash.dto.CreateReceiptRequest;
import com.barbersuite.backend.web.cash.dto.ReceiptPageResponse;
import com.barbersuite.backend.web.cash.dto.ReceiptResponse;
import com.barbersuite.backend.web.cash.dto.VoidReceiptRequest;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@BranchRequired
@RequestMapping("/api/v1/receipts")
public class ReceiptsController {

  private final CashService cashService;

  public ReceiptsController(CashService cashService) {
    this.cashService = cashService;
  }

  @GetMapping
  ReceiptPageResponse listReceipts(
    @AuthenticationPrincipal Jwt jwt,
    @RequestParam(required = false) String from,
    @RequestParam(required = false) String to,
    @RequestParam(required = false) String status,
    @RequestParam(required = false) String q,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    return cashService.listReceipts(jwt, from, to, status, q, page, size);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  ReceiptResponse createReceipt(
    @AuthenticationPrincipal Jwt jwt,
    @Valid @RequestBody CreateReceiptRequest createReceiptRequest
  ) {
    return cashService.createReceipt(jwt, createReceiptRequest);
  }

  @GetMapping("/{receiptId}")
  ReceiptResponse getReceipt(
    @AuthenticationPrincipal Jwt jwt,
    @PathVariable UUID receiptId
  ) {
    return cashService.getReceipt(jwt, receiptId);
  }

  @PostMapping("/{receiptId}/void")
  ReceiptResponse voidReceipt(
    @AuthenticationPrincipal Jwt jwt,
    @PathVariable UUID receiptId,
    @Valid @RequestBody VoidReceiptRequest voidReceiptRequest
  ) {
    return cashService.voidReceipt(jwt, receiptId, voidReceiptRequest);
  }
}

package com.barbersuite.backend.observability;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

@Component
public class BusinessMetrics {

  private final Counter servicesCreatedCounter;
  private final Counter clientsCreatedCounter;
  private final Counter clientsSearchCounter;

  public BusinessMetrics(MeterRegistry meterRegistry) {
    this.servicesCreatedCounter = Counter.builder("barbersuite_service_creations_total")
      .description("Total successful service creations.")
      .register(meterRegistry);
    this.clientsCreatedCounter = Counter.builder("barbersuite_client_creations_total")
      .description("Total successful client creations.")
      .register(meterRegistry);
    this.clientsSearchCounter = Counter.builder("barbersuite_clients_search_total")
      .description("Total client list requests with a non-empty search query.")
      .register(meterRegistry);
  }

  public void recordServiceCreated() {
    servicesCreatedCounter.increment();
  }

  public void recordClientCreated() {
    clientsCreatedCounter.increment();
  }

  public void recordClientSearch() {
    clientsSearchCounter.increment();
  }
}

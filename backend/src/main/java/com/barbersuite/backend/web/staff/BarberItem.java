package com.barbersuite.backend.web.staff;

import java.util.UUID;

public record BarberItem(UUID id, String fullName, boolean active) {
}

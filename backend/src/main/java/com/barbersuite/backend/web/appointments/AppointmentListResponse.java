package com.barbersuite.backend.web.appointments;

import java.util.List;

public record AppointmentListResponse(List<AppointmentResponse> items) {
}

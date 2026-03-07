import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background:
            "linear-gradient(135deg, rgb(255, 251, 235) 0%, rgb(255, 255, 255) 45%, rgb(245, 245, 244) 100%)",
          color: "rgb(28, 25, 23)",
          display: "flex",
          fontFamily: "sans-serif",
          height: "100%",
          justifyContent: "space-between",
          padding: "56px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "62%" }}>
          <div
            style={{
              border: "1px solid rgba(245, 158, 11, 0.25)",
              borderRadius: "999px",
              color: "rgb(146, 64, 14)",
              display: "flex",
              fontSize: 24,
              padding: "10px 18px",
              alignSelf: "flex-start",
            }}
          >
            Agenda, caja, reportes y notificaciones
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ display: "flex", fontSize: 74, fontWeight: 700, lineHeight: 1.04 }}>
              BarberSuite opera la barbería completa desde una sola plataforma.
            </div>
            <div style={{ color: "rgb(87, 83, 78)", display: "flex", fontSize: 30, lineHeight: 1.35 }}>
              Multi-tenant, branch-scoped, con agenda, caja, reportes y notificaciones listas para crecer.
            </div>
          </div>
          <div style={{ color: "rgb(120, 113, 108)", display: "flex", fontSize: 24 }}>
            barbersuite.app
          </div>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.82)",
            border: "1px solid rgba(231, 229, 228, 1)",
            borderRadius: 36,
            boxShadow: "0 28px 60px rgba(28, 25, 23, 0.08)",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            justifyContent: "center",
            padding: 28,
            width: "30%",
          }}
        >
          {["Agenda", "Caja", "Reportes", "Outbox"].map((label, index) => (
            <div
              key={label}
              style={{
                alignItems: "center",
                background: index === 0 ? "rgba(245, 158, 11, 0.14)" : "rgba(245, 245, 244, 1)",
                borderRadius: 24,
                display: "flex",
                fontSize: 30,
                fontWeight: 600,
                justifyContent: "space-between",
                padding: "20px 22px",
              }}
            >
              <span>{label}</span>
              <span>{index === 0 ? "Live" : "Ready"}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}


#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_PATH="$SCRIPT_DIR/demo-credentials.json"
SIGNUP_URL="http://localhost:8080/api/v1/tenants/signup"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
EMAIL="demo+${TIMESTAMP}@example.com"
PASSWORD="DemoPass123!"
CREATED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
PAYLOAD=$(cat <<JSON
{"tenantName":"BarberSuite Demo ${TIMESTAMP}","branchName":"Sucursal Demo","branchCode":"DEMO","timeZone":"America/Guayaquil","adminFullName":"Demo Admin","adminEmail":"${EMAIL}","adminPassword":"${PASSWORD}"}
JSON
)

RESPONSE="$(curl --silent --show-error --fail \
  -X POST "$SIGNUP_URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")" || {
  echo "No se pudo crear el tenant demo. Verifica que el backend este arriba en http://localhost:8080 y vuelve a intentar." >&2
  exit 1
}

node - "$OUTPUT_PATH" "$EMAIL" "$PASSWORD" "$CREATED_AT" "$RESPONSE" <<'NODE'
const fs = require("fs");

const [outputPath, email, password, createdAt, raw] = process.argv.slice(2);
const response = JSON.parse(raw);

const payload = {
  email,
  password,
  tenantId: response.tenantId,
  branchId: response.branchId,
  userId: response.userId,
  createdAt,
};

fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
console.log(`Tenant demo creado.
Credenciales guardadas en ${outputPath}
Email: ${email}
Password: ${password}`);
NODE

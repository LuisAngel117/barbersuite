$ErrorActionPreference = "Stop"

$outputPath = Join-Path $PSScriptRoot "demo-credentials.json"
$signupUri = "http://localhost:8080/api/v1/tenants/signup"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$email = "demo+$timestamp@example.com"
$password = "DemoPass123!"
$createdAt = (Get-Date).ToUniversalTime().ToString("o")

$payload = @{
    tenantName = "BarberSuite Demo $timestamp"
    branchName = "Sucursal Demo"
    branchCode = "DEMO"
    timeZone = "America/Guayaquil"
    adminFullName = "Demo Admin"
    adminEmail = $email
    adminPassword = $password
}

try {
    $response = Invoke-RestMethod `
        -Method Post `
        -Uri $signupUri `
        -ContentType "application/json" `
        -Body ($payload | ConvertTo-Json -Depth 4)
} catch {
    Write-Error "No se pudo crear el tenant demo. Verifica que el backend este arriba en http://localhost:8080 y vuelve a intentar."
    exit 1
}

$credentials = [ordered]@{
    email = $email
    password = $password
    tenantId = $response.tenantId
    branchId = $response.branchId
    userId = $response.userId
    createdAt = $createdAt
}

$credentials | ConvertTo-Json -Depth 4 | Set-Content -Path $outputPath -Encoding utf8

Write-Host "Tenant demo creado."
Write-Host "Credenciales guardadas en $outputPath"
Write-Host "Email: $email"
Write-Host "Password: $password"

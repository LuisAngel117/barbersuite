async function waitForUrl(url: string, label: string) {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: "manual",
        cache: "no-store",
      });

      if (response.ok || response.status === 307 || response.status === 308) {
        return;
      }
    } catch {
      // ignore and retry
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error(`${label} did not become ready in time: ${url}`);
}

export default async function globalSetup() {
  await waitForUrl(process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000", "frontend");
  await waitForUrl(
    process.env.PLAYWRIGHT_BACKEND_HEALTH_URL ?? "http://localhost:8080/actuator/health",
    "backend",
  );
}

import { setTimeout as delay } from "node:timers/promises";

const base = "https://mutantbeans.com/admin";
async function check() {
  const [panel, login] = await Promise.all(
    ["/", "/auth/login"].map(path => fetch(base + path, {
      redirect: "manual",
      headers: { "Cache-Control": "no-cache" },
      signal: AbortSignal.timeout(8000),
    })),
  );
  const target = new URL(login.headers.get("location") ?? "/", base);
  const panelOk = panel.status === 200 &&
    panel.headers.get("content-type")?.includes("text/html");
  const loginOk = login.status === 302 && target?.origin === "https://github.com" &&
    target.pathname === "/login/oauth/authorize";
  if (!panelOk || !loginOk) {
    throw new Error(`Panel HTTP ${panel.status}; login HTTP ${login.status}; GitHub OAuth redirect: ${loginOk}`);
  }
}

for (let attempt = 1; attempt <= 5; attempt++) {
  try {
    await check();
    console.log("Admin responds with 200 and login redirects to GitHub OAuth.");
    break;
  } catch (error) {
    console.error(`Attempt ${attempt}: ${error.message}`);
    if (attempt === 5) process.exitCode = 1;
    else await delay(3000);
  }
}

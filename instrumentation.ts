// Runs once when the server starts:
// 1. Connects the Discord bot gateway (coach /startcall and /endcall, voice attendance, rating DMs).
// 2. When SITE_LAUNCHED=true, sends the one-time launch DM to the waitlist. Already-notified
//    members are skipped, so redeploys are safe.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { startGateway } = await import("@/lib/coach/gateway");

  startGateway().catch((error) => console.error("[discord] Gateway failed to start", error));

  const { isSiteLaunched } = await import("@/lib/site");

  if (!isSiteLaunched()) {
    return;
  }

  setTimeout(async () => {
    try {
      const { sendLaunchDms } = await import("@/lib/discord-bot");
      await sendLaunchDms();
    } catch (error) {
      console.error("[discord] Launch DM run failed", error);
    }
  }, 15000);
}

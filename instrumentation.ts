// When the site is launched (SITE_LAUNCHED=true), send the one-time launch DM to the waitlist
// shortly after the server starts. Already-notified members are skipped, so redeploys are safe.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

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

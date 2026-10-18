import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { VMark } from "@/components/Logo";
import { SignInWithDiscord } from "@/components/AuthButtons";
import { Notice } from "@/components/ui";
import { getCurrentMember } from "@/lib/session";
import { isDiscordConfigured } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sign in",
};

const ERRORS: Record<string, string> = {
  AccessDenied: "Sign-in was cancelled. You can try again whenever you're ready.",
  OAuthCallbackError: "Sign-in was cancelled or Discord returned an error. Please try again.",
  OAuthSignin: "We couldn't start Discord sign-in. Please try again.",
  OAuthAccountNotLinked: "This Discord account is linked to another profile.",
  Configuration: "Sign-in isn't configured correctly yet. Please contact support.",
  Verification: "Your sign-in link expired. Please try again.",
};

function safeCallback(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/profile";
}

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const callbackUrl = safeCallback(searchParams.callbackUrl);
  const member = await getCurrentMember();

  if (member) {
    redirect(callbackUrl);
  }

  const errorCode = typeof searchParams.error === "string" ? searchParams.error : null;
  const configured = isDiscordConfigured();

  return (
    <section className="container-page flex justify-center py-20 sm:py-28">
      <div className="card w-full max-w-md p-8 text-center sm:p-10">
        <VMark className="mx-auto h-12 w-auto text-gold" />
        <h1 className="display mt-8 text-2xl text-cream">Welcome to Ventrio</h1>
        <span className="gold-rule mx-auto mt-6" />
        <p className="mt-6 text-sm leading-relaxed text-slate">
          Sign in with Discord to create your member profile, register for events and enter pitch
          competitions.
        </p>

        {errorCode && (
          <div className="mt-6 text-left">
            <Notice tone="error">
              {ERRORS[errorCode] ?? "Something went wrong during sign-in. Please try again."}
            </Notice>
          </div>
        )}

        <div className="mt-8">
          {configured ? (
            <SignInWithDiscord
              callbackUrl={callbackUrl}
              className="btn btn-gold w-full"
            />
          ) : (
            <div className="text-left">
              <Notice
                tone="warning"
                title="Discord sign-in isn't set up yet"
              >
                The site owner needs to add <code>AUTH_DISCORD_ID</code>, <code>AUTH_DISCORD_SECRET</code> and{" "}
                <code>AUTH_SECRET</code>. See the README setup checklist.
              </Notice>
            </div>
          )}
        </div>

        <p className="mt-8 text-xs leading-relaxed text-slate">
          We only request your Discord username and avatar — never your email, servers or messages. We&apos;ll
          never ask for your Discord password or token. By signing in you agree to our{" "}
          <Link
            href="/terms"
            className="text-cream hover:text-gold"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-cream hover:text-gold"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import { SignOutButton } from "@/components/AuthButtons";
import { DeleteAccountForm, PrivacyForm } from "@/components/SettingsForms";
import { deleteAccount, updatePrivacy } from "@/app/actions/profile";
import { requireMember } from "@/lib/session";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const { profile } = await requireMember("/settings");

  return (
    <section className="container-page max-w-3xl py-12 sm:py-16">
      <p className="eyebrow">Account</p>
      <h1 className="display mt-4 text-2xl text-cream sm:text-3xl">Settings</h1>
      <span className="gold-rule mt-6" />

      <div className="card mt-10 p-6 sm:p-8">
        <h2 className="font-display text-base font-semibold text-cream">Privacy</h2>
        <p className="mt-2 text-sm text-slate">
          Your profile is private until you choose to make it public. You decide which fields appear.
        </p>
        <div className="mt-6">
          <PrivacyForm
            profile={profile}
            action={updatePrivacy}
          />
        </div>
      </div>

      <div className="card mt-6 p-6 sm:p-8">
        <h2 className="font-display text-base font-semibold text-cream">Connected account</h2>
        <p className="mt-2 text-sm text-slate">
          Signed in with Discord as <span className="text-cream">@{profile.discordUsername}</span>. Your
          username and avatar update automatically each time you sign in.
        </p>
        <div className="mt-6">
          <SignOutButton className="btn btn-outline" />
        </div>
      </div>

      <div className="card mt-6 border-red-400/20 p-6 sm:p-8">
        <h2 className="font-display text-base font-semibold text-cream">Delete account</h2>
        <p className="mt-2 text-sm text-slate">
          Permanently delete your profile, event registrations and competition submissions. This can&apos;t be
          undone.
        </p>
        <div className="mt-6">
          <DeleteAccountForm action={deleteAccount} />
        </div>
      </div>
    </section>
  );
}

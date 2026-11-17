import { ProfileShell } from "@/components/profile/ProfileShell";
import { requireMember } from "@/lib/session";

export default async function SettingsLayout({ children }: LayoutProps<"/settings">) {
  const member = await requireMember("/settings");

  return <ProfileShell member={member}>{children}</ProfileShell>;
}

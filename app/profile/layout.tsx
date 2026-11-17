import { ProfileShell } from "@/components/profile/ProfileShell";
import { requireMember } from "@/lib/session";

export default async function ProfileLayout({ children }: LayoutProps<"/profile">) {
  const member = await requireMember("/profile");

  return <ProfileShell member={member}>{children}</ProfileShell>;
}

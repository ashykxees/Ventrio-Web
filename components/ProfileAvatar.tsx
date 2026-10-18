import Image from "next/image";
import { discordAvatarUrl } from "@/lib/members";

export function ProfileAvatar({
  discordId,
  avatar,
  size = 96,
  className = "",
}: {
  discordId: string;
  avatar: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={discordAvatarUrl(discordId, avatar)}
      alt=""
      width={size}
      height={size}
      className={`rounded-full border border-line-strong ${className}`}
    />
  );
}

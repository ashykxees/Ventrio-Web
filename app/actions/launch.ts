"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/session";

export async function setLaunchNotify(enabled: boolean): Promise<void> {
  const member = await getCurrentMember();

  if (!member) {
    return;
  }

  await prisma.profile.update({
    where: { userId: member.userId },
    data: { notifyOnLaunch: enabled },
  });

  revalidatePath("/");
}

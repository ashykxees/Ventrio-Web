import { requireLeadership } from "@/lib/coach/access";

export default async function LeadershipLayout({ children }: { children: React.ReactNode }) {
  await requireLeadership();

  return <>{children}</>;
}

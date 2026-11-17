import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/session";

const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

// Serves an uploaded product image if the owner's profile shows products publicly, or to the owner.
export async function GET(_request: Request, ctx: RouteContext<"/api/products/[id]/image">) {
  const { id } = await ctx.params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { image: true, imageType: true, userId: true, user: { select: { profile: true } } },
  });

  if (!product?.image || !ALLOWED.has(product.imageType)) {
    return new Response("Not found", { status: 404 });
  }

  const profile = product.user.profile;
  const isPublic = Boolean(profile?.isPublic && profile.showProducts);

  if (!isPublic) {
    const member = await getCurrentMember();

    if (member?.userId !== product.userId) {
      return new Response("Not found", { status: 404 });
    }
  }

  return new Response(new Uint8Array(product.image), {
    headers: {
      "content-type": product.imageType,
      "cache-control": "private, no-cache",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'",
    },
  });
}

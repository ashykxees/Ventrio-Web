"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/session";
import { ActionError, runAction, type ActionState } from "@/lib/coach/action";
import { fetchLinkPreview, normalizeUrl, PreviewError } from "@/lib/link-preview";
import { PRODUCT_IMAGE_MAX_BYTES, PRODUCT_KINDS, PRODUCT_LIMIT } from "@/lib/products";

// Magic bytes for the image types we accept; the browser-supplied MIME type is not trusted.
function sniffImageType(bytes: Uint8Array): string | null {
  const hex = Buffer.from(bytes.subarray(0, 12)).toString("hex");

  if (hex.startsWith("89504e470d0a1a0a")) return "image/png";
  if (hex.startsWith("ffd8ff")) return "image/jpeg";
  if (hex.startsWith("47494638")) return "image/gif";
  if (hex.startsWith("52494646") && hex.slice(16, 24) === "57454250") return "image/webp";

  return null;
}

async function readImage(value: FormDataEntryValue | null): Promise<{ data: Uint8Array<ArrayBuffer>; type: string } | null> {
  if (!value || typeof value === "string" || value.size === 0) {
    return null;
  }

  if (value.size > PRODUCT_IMAGE_MAX_BYTES) {
    throw new ActionError("Images must be 2 MB or smaller.");
  }

  const data = new Uint8Array(await value.arrayBuffer());
  const type = sniffImageType(data);

  if (!type) {
    throw new ActionError("Upload a PNG, JPG, WebP or GIF image.");
  }

  return { data, type };
}

async function memberOnly() {
  const member = await getCurrentMember();

  if (!member) {
    throw new ActionError("Your session has expired. Please sign in again.");
  }

  return member;
}

function refresh(handle: string) {
  revalidatePath("/profile/products");
  revalidatePath(`/members/${handle}`);
}

const addSchema = z.object({
  url: z.string().trim().min(1, "Paste a link to your website or app.").max(500, "That link is too long."),
  kind: z.enum(PRODUCT_KINDS),
});

export async function addProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const member = await memberOnly();
    const input = addSchema.parse({ url: formData.get("url") ?? "", kind: formData.get("kind") || "WEBSITE" });
    const url = normalizeUrl(input.url);

    if (!url) {
      throw new ActionError("That doesn't look like a website link. Try something like https://your-site.com");
    }

    const image = await readImage(formData.get("image"));

    if (input.kind === "DIGITAL" && !image) {
      throw new ActionError("Digital products need an image of the product.");
    }

    const count = await prisma.product.count({ where: { userId: member.userId } });

    if (count >= PRODUCT_LIMIT) {
      throw new ActionError(`You can show up to ${PRODUCT_LIMIT} apps and products. Remove one to add another.`);
    }

    const preview = await fetchLinkPreview(url).catch((error) => {
      throw error instanceof PreviewError ? new ActionError(error.message) : error;
    });

    await prisma.product.create({
      data: {
        userId: member.userId,
        kind: input.kind,
        url: preview.url,
        title: preview.title,
        description: preview.description,
        siteName: preview.siteName,
        logoUrl: preview.logoUrl,
        thumbnailUrl: preview.thumbnailUrl,
        image: image?.data,
        imageType: image?.type ?? "",
        position: count,
        fetchedAt: preview.fetched ? new Date() : null,
      },
    });

    refresh(member.profile.handle);

    return preview.fetched
      ? "Added. It now shows on your profile."
      : "Added, but we couldn't read details from that website. It shows with a basic card.";
  });
}

async function ownProduct(userId: string, id: unknown) {
  const product = await prisma.product.findFirst({
    where: { id: z.string().min(1).max(40).parse(id), userId },
    omit: { image: true },
  });

  if (!product) {
    throw new ActionError("That product no longer exists.");
  }

  return product;
}

export async function refreshProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const member = await memberOnly();
    const product = await ownProduct(member.userId, formData.get("id"));
    const url = normalizeUrl(product.url);

    if (!url) {
      throw new ActionError("That link is no longer valid.");
    }

    const preview = await fetchLinkPreview(url).catch((error) => {
      throw error instanceof PreviewError ? new ActionError(error.message) : error;
    });

    if (!preview.fetched) {
      throw new ActionError("We couldn't read that website right now, so nothing changed.");
    }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        title: preview.title,
        description: preview.description,
        siteName: preview.siteName,
        logoUrl: preview.logoUrl,
        thumbnailUrl: preview.thumbnailUrl,
        fetchedAt: new Date(),
      },
    });

    refresh(member.profile.handle);

    return "Refreshed from the website.";
  });
}

export async function replaceProductImage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const member = await memberOnly();
    const product = await ownProduct(member.userId, formData.get("id"));
    const image = await readImage(formData.get("image"));

    if (!image) {
      throw new ActionError("Choose an image to upload.");
    }

    await prisma.product.update({ where: { id: product.id }, data: { image: image.data, imageType: image.type } });
    refresh(member.profile.handle);

    return "Image updated.";
  });
}

export async function removeProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const member = await memberOnly();
    const product = await ownProduct(member.userId, formData.get("id"));

    await prisma.product.delete({ where: { id: product.id } });
    refresh(member.profile.handle);

    return "Removed.";
  });
}

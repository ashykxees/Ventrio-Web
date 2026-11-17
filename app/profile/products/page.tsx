import type { Metadata } from "next";
import { addProduct, refreshProduct, removeProduct, replaceProductImage } from "@/app/actions/products";
import { ProductCard } from "@/components/profile/ProductCard";
import { AddProductForm, ProductActions } from "@/components/profile/ProductForms";
import { SectionTitle } from "@/components/profile/ProfileShell";
import { prisma } from "@/lib/prisma";
import { PRODUCT_LIMIT, toProductCard } from "@/lib/products";
import { requireMember } from "@/lib/session";

export const metadata: Metadata = {
  title: "Apps & Products",
};

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ removed?: string }> }) {
  const { userId, profile } = await requireMember("/profile/products");
  const { removed } = await searchParams;
  const rows = await prisma.product.findMany({ where: { userId }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
  const products = rows.map(toProductCard);
  const visible = profile.isPublic && profile.showProducts;

  return (
    <>
      <SectionTitle
        eyebrow="Business"
        title="Apps & Products"
        description="Paste a link and we'll build a card for your public profile."
      />

      <div className="card p-6">
        <AddProductForm
          notice={removed}
          action={addProduct}
          disabled={products.length >= PRODUCT_LIMIT}
        />
      </div>

      {removed && (
        <p
          role="status"
          className="mt-4 text-sm text-emerald-300"
        >
          Removed from your profile.
        </p>
      )}

      <div className="mt-8 flex items-center justify-between">
        <p className="font-display text-[0.65rem] font-semibold tracking-[0.2em] text-slate uppercase">
          On your profile ({products.length}/{PRODUCT_LIMIT})
        </p>
        {!visible && (
          <p className="text-xs text-slate">
            {profile.isPublic ? "Hidden: turn on Apps & products in Privacy." : "Your profile is private."}
          </p>
        )}
      </div>

      {products.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-line-strong p-8 text-center text-sm text-slate">
          Nothing here yet. Add your first website, app or digital product above.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            >
              <ProductActions
                id={product.id}
                isDigital={product.kind === "DIGITAL"}
                refreshAction={refreshProduct}
                removeAction={removeProduct}
                imageAction={replaceProductImage}
              />
            </ProductCard>
          ))}
        </div>
      )}
    </>
  );
}

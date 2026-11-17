import { ExternalLink, Package } from "lucide-react";
import { PRODUCT_KIND_LABELS, productImageSrc, type ProductCardData } from "@/lib/products";

/* eslint-disable @next/next/no-img-element -- third-party site images can't use next/image remote patterns */
export function ProductCard({ product, children }: { product: ProductCardData; children?: React.ReactNode }) {
  const image = productImageSrc(product);
  const host = product.url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];

  return (
    <article className="card flex flex-col overflow-hidden">
      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="group flex flex-1 flex-col"
      >
        <div className="relative aspect-[1.91/1] w-full overflow-hidden border-b border-line bg-panel">
          {image ? (
            <img
              src={image}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-panel to-charcoal">
              <Package className="h-8 w-8 text-gold/60" />
            </div>
          )}
          <span className="absolute top-2 left-2 rounded-full border border-line-strong bg-charcoal/80 px-2 py-0.5 font-display text-[0.58rem] font-semibold tracking-[0.16em] text-cream uppercase backdrop-blur">
            {PRODUCT_KIND_LABELS[product.kind] ?? "Website"}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-center gap-2.5">
            {product.logoUrl ? (
              <img
                src={product.logoUrl}
                alt=""
                width={28}
                height={28}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-7 w-7 shrink-0 rounded-md border border-line bg-cream/5 object-contain"
              />
            ) : (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line font-display text-xs text-gold">
                {product.title.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold text-cream group-hover:text-gold">
                {product.title}
              </p>
              <p className="flex items-center gap-1 truncate text-xs text-slate">
                {host}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </p>
            </div>
          </div>
          {product.description && (
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate">{product.description}</p>
          )}
        </div>
      </a>
      {children && <div className="border-t border-line px-4 py-3">{children}</div>}
    </article>
  );
}

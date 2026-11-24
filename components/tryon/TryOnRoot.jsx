"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { byId } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import { TRYON_ENABLED } from "./config";

// The modal (and, inside it, the Hugging Face Gradio client) is only downloaded when someone clicks "Try it on".
const TryOnModal = dynamic(() => import("./TryOnModal"), { ssr: false });

// Mounted once in the layout. Any element with class "tryon-btn" opens the modal, React or plain HTML:
//   <button class="tryon-btn" data-image="/products/lune-slip.webp" data-name="Lune Slip Dress" data-id="lune-slip" data-category="one-pieces">Try it on</button>
// data-category (tops | bottoms | one-pieces) is optional: otherwise it comes from public/tryon/products.json or the name.
export default function TryOnRoot() {
  const [product, setProduct] = useState(null);
  const { addToBag } = useApp();

  useEffect(() => {
    if (!TRYON_ENABLED) return;
    const onClick = (e) => {
      const b = e.target.closest?.(".tryon-btn");
      if (!b?.dataset.image) return;
      e.preventDefault();
      e.stopPropagation();
      setProduct({ id: b.dataset.id || "", name: b.dataset.name || "This piece", image: b.dataset.image, category: b.dataset.category || "" });
    };
    document.addEventListener("click", onClick, true); // capture: wins over links the button sits inside
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!TRYON_ENABLED || !product) return null;
  return (
    <TryOnModal
      key={product.image}
      product={product}
      onClose={() => setProduct(null)}
      // your cart: catalogue pieces go into the bag; swap this for any other cart call
      onAddToCart={(p) => byId(p.id) && addToBag(p.id)}
    />
  );
}

"use client";
// Static export has no image optimiser, so images are served as-is from public/.
// next/image doesn't add basePath to string srcs, so prefix local paths here.
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function imageLoader({ src, width }) {
  if (!src.startsWith("/")) return src;
  return `${base}${src}?w=${width}`; // ?w keeps each srcset entry distinct
}

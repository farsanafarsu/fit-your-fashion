import { Suspense } from "react";
import DressingRoom from "@/components/dressing/DressingRoom";

export const metadata = { title: "AI Dressing Room — FIT YOUR FASHION" };

export default function Page() {
  return (
    <main id="main">
      <h1 className="sr-only">AI Virtual Dressing Room</h1>
      <Suspense fallback={<div className="ai-shimmer h-screen" />}>
        <DressingRoom />
      </Suspense>
    </main>
  );
}

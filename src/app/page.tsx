"use client";

import { PLASMIC } from "@/lib/plasmic";
import { PlasmicRootProvider, PlasmicComponent } from "@plasmicapp/loader-nextjs";

export default function Page() {
  const slug = "landing";

  return (
    <PlasmicRootProvider loader={PLASMIC}>
      <PlasmicComponent component={slug} />
    </PlasmicRootProvider>
  );
}
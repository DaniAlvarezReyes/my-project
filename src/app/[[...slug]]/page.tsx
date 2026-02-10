"use client";

import { PLASMIC } from "@/lib/plasmic";
import { PlasmicRootProvider, PlasmicComponent } from "@plasmicapp/loader-nextjs";
import { usePathname } from "next/navigation";

export default function CatchAllPage() {
  // obtenemos la ruta actual
  const pathname = usePathname() || "/";
  
  // convertimos "/" a "homepage" (slug de Plasmic)
  const slug = pathname === "/" ? "Homepage" : pathname.slice(1);

  return (
    <PlasmicRootProvider loader={PLASMIC}>
      <PlasmicComponent component={slug} />
    </PlasmicRootProvider>
  );
}

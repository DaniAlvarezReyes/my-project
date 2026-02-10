"use client";

import {
  PlasmicComponent,
  PlasmicRootProvider,
  ComponentRenderData ,
} from "@plasmicapp/loader-nextjs";
import { PLASMIC } from "@/lib/plasmic";

export default function PlasmicRenderer({
  component,
  prefetchedData,
}: {
  component: string;
  prefetchedData: ComponentRenderData ;
}) {
  return (
    <PlasmicRootProvider
      loader={PLASMIC}
      prefetchedData={prefetchedData}
    >
      <PlasmicComponent component={component} />
    </PlasmicRootProvider>
  );
}

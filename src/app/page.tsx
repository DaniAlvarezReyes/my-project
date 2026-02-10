import { PLASMIC } from "../lib/plasmic";
import { PlasmicRootProvider, PlasmicComponent } from "@plasmicapp/loader-nextjs";

export default async function PlasmicPage({
  params,
}: {
  params: { slug?: string[] };
}) {
  const slug = params.slug?.join("/") || "landing";

  const componentData = await PLASMIC.maybeFetchComponentData(slug);

  if (!componentData) {
    return <div>Page not found</div>;
  }

  return (
    <PlasmicRootProvider loader={PLASMIC} prefetchedData={componentData}>
      <PlasmicComponent component={slug} />
    </PlasmicRootProvider>
  );
}

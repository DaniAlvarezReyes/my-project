import { PLASMIC } from "@/lib/plasmic";
import PlasmicRenderer from "@/components/plasmic/PlasmicRenderer";

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
    <PlasmicRenderer
      component={slug}
      prefetchedData={componentData}
    />
  );
}

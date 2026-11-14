import Catalog from "@/components/catalog";

export default async function Page({ params }) {
  const { section } = await params;
  return <Catalog kind="section" identifier={section} />;
}

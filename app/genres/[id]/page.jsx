import Catalog from "@/components/catalog";
export default async function Page({ params }) {
  const { id } = await params;
  return <Catalog kind="genre" identifier={id} />;
}

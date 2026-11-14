import Catalog from "@/components/catalog";
export default async function Page({ params }) {
  const { letter } = await params;
  return <Catalog kind="az" identifier={letter} />;
}

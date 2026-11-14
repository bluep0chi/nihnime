import Watch from "@/components/watch";
export default async function Page({ params }) {
  const { id } = await params;
  return <Watch id={id} />;
}

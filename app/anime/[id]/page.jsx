import AnimeDetail from "@/components/anime-detail";
export default async function Page({ params }) {
  const { id } = await params;
  return <AnimeDetail id={id} />;
}

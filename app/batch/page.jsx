import { redirect } from "next/navigation";
// AnimeIn does not expose batch downloads; show finished anime instead.
export default function Page() { redirect("/completed"); }

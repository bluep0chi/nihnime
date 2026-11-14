import { Breadcrumb, Columns, Content, GenericSidebar, WidgetTitle } from "@/components/ui";
export default function Page() {
  return <><Breadcrumb items={[{ title: "Disclaimers" }]} /><Columns><Content><WidgetTitle title="Disclaimers" /><p className="text-zinc-700 dark:text-zinc-300">NIHNIME tidak menyimpan video di servernya. Video dan gambar berasal dari layanan pihak ketiga; ketersediaan serta hak atas konten berada pada pemilik dan penyedia masing-masing. Untuk masalah hak cipta, hubungi penyedia konten yang bersangkutan.</p></Content><GenericSidebar /></Columns></>;
}

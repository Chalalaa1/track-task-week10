import { redirect } from "next/navigation";
import { getTeamContext } from "@/lib/team";

export default async function MyPage() {
  const { team } = await getTeamContext();
  if (!team) redirect("/team");
  return <main className="mx-auto w-full max-w-3xl px-4 py-10"><h1 className="text-2xl font-bold">งานของฉัน</h1><p className="mt-4">ส่วนงานของฉันจะเพิ่มใน US-5</p></main>;
}

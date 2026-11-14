import Link from "next/link";
import { getTeamContext, getTeamMembers } from "@/lib/team";
import { TeamForms } from "./team-forms";

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { supabase, user, team } = await getTeamContext();
  const params = await searchParams;
  const members = team ? await getTeamMembers(supabase, team.id) : [];
  return <main className="mx-auto w-full max-w-5xl px-4 py-10">
    {params.error === "signout" && <p role="alert" className="mb-4 text-red-800">ออกจากระบบไม่สำเร็จ กรุณาลองใหม่</p>}
    <h1 className="text-2xl font-bold">ทีมของฉัน</h1>
    {!team ? <><p className="mt-2 text-slate-600">คุณยังไม่มีทีม สร้างทีมใหม่หรือเข้าร่วมทีมของเพื่อน</p><TeamForms /></> : <>
      <section className="mt-6 space-y-4 rounded-2xl border bg-white p-6">
        <h2 className="break-words text-xl font-semibold">{team.name}</h2>
        <p role="status">คุณเป็น{team.owner_id === user.id ? "หัวหน้าทีม" : "สมาชิกทีม"}</p>
        <p>รหัสเชิญ: <strong className="font-mono text-2xl tracking-widest">{team.invite_code}</strong></p>
        <p className="text-sm text-slate-600">ส่งรหัสนี้ให้เพื่อนเพื่อเข้าร่วมทีม ทุกคนอยู่ได้เพียงทีมเดียว</p>
        <Link className="inline-block rounded-lg bg-blue-700 px-4 py-3 text-white" href="/tasks">ดูงานของทีม</Link>
      </section>
      <section className="mt-8"><h2 className="text-xl font-semibold">สมาชิกทีม ({members.length})</h2>
        {members.length === 0 ? <p className="mt-4">ยังไม่มีข้อมูลสมาชิก</p> : <ul className="mt-4 divide-y rounded-xl border bg-white">{members.map(member => <li key={member.user_id} className="flex flex-wrap justify-between gap-3 p-4">
          <div className="min-w-0"><p className="break-words font-medium">{member.display_name}{member.user_id === user.id ? " (คุณ)" : ""}</p><p className="break-all text-sm text-slate-600">{member.email}</p></div>
          <span>{member.user_id === team.owner_id ? "หัวหน้า" : "สมาชิก"}</span>
        </li>)}</ul>}
      </section>
    </>}
  </main>;
}

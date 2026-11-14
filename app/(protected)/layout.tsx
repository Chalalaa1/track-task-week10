import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { signOut } from "@/app/login/actions";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  if (!hasSupabaseEnv) redirect("/login");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile, error } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).single();
  return <>
    <header className="border-b bg-white px-4 py-4"><div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
      <Link href="/team" className="font-semibold text-blue-800">ระบบติดตามงานทีม</Link>
      <nav aria-label="เมนูหลัก" className="flex gap-4"><Link href="/team" className="text-blue-800 underline">ทีมของฉัน</Link><Link href="/tasks" className="text-blue-800 underline">งานของทีม</Link></nav>
      <div className="flex max-w-full flex-wrap items-center gap-4"><span className="break-all">{profile?.display_name ?? "ผู้ใช้"}</span><form action={signOut}><button className="rounded-lg border px-3 py-2">ออกจากระบบ</button></form></div>
    </div></header>
    {error && <p role="alert" className="mx-auto mt-4 max-w-xl px-4 text-red-800">อ่านชื่อผู้ใช้ไม่ได้ กรุณาตรวจว่ารันไฟล์ SQL ของ US-1 แล้ว และลองโหลดหน้าใหม่</p>}
    {children}
  </>;
}

import { AuthForm } from "./auth-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const params = await searchParams;
  return <main className="mx-auto w-full max-w-md px-4 py-12">
    <h1 className="text-2xl font-bold">ระบบติดตามงานทีม</h1>
    <p className="mb-6 mt-2 text-slate-600">เข้าสู่ระบบหรือสมัครบัญชีเพื่อเริ่มทำงานร่วมกัน</p>
    {params.success === "signed-out" && <p role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-green-800">ออกจากระบบแล้ว</p>}
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><AuthForm /></div>
  </main>;
}

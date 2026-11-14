"use client";
import { useActionState } from "react";
import { saveTeam } from "./actions";

function TeamForm({ mode }: { mode: "create" | "join" }) {
  const [state, action, pending] = useActionState(saveTeam, { error: "", success: "" });
  const create = mode === "create";
  return <form action={action} className="min-w-0 space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
    <h2 className="text-xl font-semibold">{create ? "สร้างทีม" : "เข้าร่วมทีม"}</h2>
    <input type="hidden" name="mode" value={mode} />
    <label className="block">{create ? "ชื่อทีม" : "รหัสเชิญ 6 ตัวอักษร"}<input name="value" disabled={pending} autoComplete="off" maxLength={create ? undefined : 6} className="mt-2 w-full rounded-lg border border-slate-300 p-3" /></label>
    {state.error && <p role="alert" className="text-red-800">{state.error}</p>}
    {state.success && <p role="status" className="text-green-800">{state.success}</p>}
    <button disabled={pending} className="rounded-lg bg-blue-700 px-4 py-3 text-white disabled:opacity-60">{pending ? "กำลังบันทึก…" : create ? "สร้างทีม" : "เข้าร่วมทีม"}</button>
  </form>;
}
export function TeamForms() {
  return <div className="mt-6 grid gap-6 md:grid-cols-2"><TeamForm mode="create" /><TeamForm mode="join" /></div>;
}

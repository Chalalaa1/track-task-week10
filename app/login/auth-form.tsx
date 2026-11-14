"use client";

import { useActionState, useState } from "react";
import { authenticate } from "./actions";

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [state, action, pending] = useActionState(authenticate, { error: "" });
  const inputClass = "mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 focus:outline-2 focus:outline-blue-600";
  return <>
    <div className="mb-6 flex gap-2" role="group" aria-label="เลือกวิธีเข้าใช้งาน">
      {([['login', 'เข้าสู่ระบบ'], ['signup', 'สมัครสมาชิก']] as const).map(([value, label]) => <button key={value} type="button" disabled={pending} aria-pressed={mode === value} onClick={() => setMode(value)} className={`flex-1 rounded-lg p-3 font-medium ${mode === value ? 'bg-blue-700 text-white' : 'bg-slate-100'}`}>{label}</button>)}
    </div>
    <form action={action} className="space-y-5">
      <input type="hidden" name="mode" value={mode} />
      {mode === "signup" && <label className="block">ชื่อที่แสดง<input className={inputClass} name="display_name" autoComplete="nickname" required disabled={pending} /></label>}
      <label className="block">อีเมล<input className={inputClass} name="email" type="email" autoComplete="email" required disabled={pending} /></label>
      <label className="block">รหัสผ่าน<input className={inputClass} name="password" type="password" minLength={mode === "signup" ? 6 : undefined} autoComplete={mode === "signup" ? "new-password" : "current-password"} required disabled={pending} />{mode === "signup" && <span className="mt-1 block text-sm text-slate-600">อย่างน้อย 6 ตัวอักษร</span>}</label>
      {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{state.error}</p>}
      <button disabled={pending} className="w-full rounded-lg bg-blue-700 p-3 font-semibold text-white disabled:opacity-60">{pending ? "กำลังดำเนินการ…" : mode === "signup" ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}</button>
    </form>
  </>;
}

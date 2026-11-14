"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export type AuthState = { error: string };

export async function authenticate(_: AuthState, form: FormData): Promise<AuthState> {
  if (!hasSupabaseEnv) return { error: "กรุณาตั้งค่าการเชื่อมต่อ Supabase ก่อนใช้งาน" };
  const mode = form.get("mode");
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const displayName = String(form.get("display_name") ?? "").trim();
  if (mode !== "signup" && mode !== "login") return { error: "คำขอไม่ถูกต้อง" };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "กรุณากรอกอีเมลให้ถูกต้อง" };
  if (mode === "signup" && !displayName) return { error: "กรุณากรอกชื่อที่แสดง" };
  if (password.length < 6) return { error: mode === "signup" ? "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" : "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  try {
    const supabase = await createClient();
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName } } });
      if (error) return { error: "สมัครไม่สำเร็จ อีเมลอาจถูกใช้แล้ว หรือระบบยังไม่พร้อม กรุณาติดต่อผู้ดูแล" };
      if (!data.session) return { error: "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ สำหรับ workshop ให้ผู้ดูแลปิด Confirm email" };
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    }
  } catch {
    return { error: "เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่อีกครั้ง" };
  }
  redirect("/team");
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) redirect("/team?error=signout");
  redirect("/login?success=signed-out");
}
